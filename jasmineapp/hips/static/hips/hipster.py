import glob
import math
import os
from datetime import datetime
from astropy.io.votable import writeto
from astropy.table import Table
from pathlib import Path
from shutil import rmtree

import healpy
import numpy as np
import torch
from PIL import Image
from matplotlib import pyplot as plt
import pandas as pd
import torchvision.transforms.functional as functional
from skimage import io
import torchvision.transforms.v2 as transforms


class Hipster:
    """
    Provides all functions to automatically generate a HiPS representation for a machine learning
    model that projects images on a sphere.

    Heavily inspired by the Hipster Class written by Bernd Doser for project "Spherinator"
    """

    def __init__(
        self,
        output_folder: str,
        title: str,
        max_order: int = 3,
        hierarchy: int = 1,
        crop_size: int = 64,
        distortion_correction: bool = False,
        catalog_file: str = "catalog.csv",
        votable_file: str = "catalog.vot",
        hipster_url: str = "http://localhost:8000",
    ):
        """Initializes the Hipster

        Args:
            output_folder (String): The place where to export the HiPS to. In case it exists, there
                is a user prompt before deleting the folder.
            title (String): The title string to be passed to the meta files.
            max_order (int, optional): The depth of the tiling. Should be smaller than 10.
                Defaults to 3.
            hierarchy: (int, optional): Defines how many tiles should be hierarchically combined.
                Defaults to 1.
            crop_size (int, optional): The size to be cropped from the generating model output, in
                case it might be larger. Defaults to 64.
            output_size (int, optional): Specifies the size the tilings should be scaled to. Must be
                in the powers of 2. Defaults to 128.
            distortion_correction (bool, optional): Wether or not to apply a distortion correction
            catalog_file (String, optional): The name of the catalog file to be generated.
                Defaults to "catalog.csv".
            votable_file (String, optional): The name of the votable file to be generated.
                Defaults to "catalog.vot".
            hipster_url (String, optional): The url where the HiPSter will be hosted.
                Defaults to "http://localhost:8082".
        """

        assert max_order < 10
        self.output_folder = Path(output_folder)
        self.title = title
        self.title_folder = self.output_folder / Path(title)
        self.max_order = max_order
        self.hierarchy = hierarchy
        self.crop_size = crop_size
        self.output_size = 512
        self.distortion_correction = distortion_correction
        self.catalog_file = self.title_folder / Path(catalog_file)
        self.votable_file = self.title_folder / Path(votable_file)
        self.hipster_url = hipster_url

        self.title_folder.mkdir(parents=True, exist_ok=True)

    def check_folders(self, base_folder):
        """Checks whether the base folder exists and deletes it after prompting for user input

        Args:
            base_folder (String): The base folder to check.
        """
        path = os.path.join(self.output_folder, self.title, base_folder)
        if os.path.exists(path):
            answer = input("path " + str(path) + ", delete? [y],n")
            if answer == "n":
                exit(1)
            else:
                rmtree(os.path.join(self.output_folder, self.title, base_folder))

    def create_folders(self, base_folder):
        """Creates all folders and sub-folders to store the HiPS tiles.

        Args:
            base_folder (String): The base folder to start the folder creation in.
        """
        print("creating folders:")
        if not os.path.exists(self.output_folder):
            os.mkdir(self.output_folder)
        if not os.path.exists(os.path.join(self.output_folder, self.title)):
            os.mkdir(os.path.join(self.output_folder, self.title))
        os.mkdir(os.path.join(self.output_folder, self.title, base_folder))
        for i in range(self.max_order + 1):
            os.mkdir(
                os.path.join(
                    self.output_folder, self.title, base_folder, "Norder" + str(i)
                )
            )
            for j in range(int(math.floor(12 * 4**i / 10000)) + 1):
                os.mkdir(
                    os.path.join(
                        self.output_folder,
                        self.title,
                        base_folder,
                        "Norder" + str(i),
                        "Dir" + str(j * 10000),
                    )
                )

    def create_hips_properties(self, base_folder):
        """Generates the properties file that contains the meta-information of the HiPS tiling.

        Args:
            base_folder (String): The place where to create the 'properties' file.
        """
        print("creating meta-data:")
        with open(
            os.path.join(self.output_folder, self.title, base_folder, "properties"),
            "w",
            encoding="utf-8",
        ) as output:
            # TODO: add all keywords support and write proper information
            output.write("creator_did          = ivo://HITS/hipster\n")
            output.write("obs_title            = " + self.title + "\n")
            output.write("obs_description      = blablabla\n")
            output.write("dataproduct_type     = image\n")
            output.write("dataproduct_subtype  = color\n")
            output.write("hips_version         = 1.4\n")
            output.write("prov_progenitor      = blablabla\n")
            output.write("hips_creation_date   = " + datetime.now().isoformat() + "\n")
            output.write("hips_release_date    = " + datetime.now().isoformat() + "\n")
            output.write("hips_status          = public master clonable\n")
            output.write("hips_tile_format     = jpeg\n")
            output.write("hips_order           = " + str(self.max_order) + "\n")
            output.write(
                "hips_tile_width      = "
                + str(self.output_size * self.hierarchy)
                + "\n"
            )
            output.write("hips_frame           = equatorial\n")
            output.flush()


    def create_allsky(self, dir_id=0, edge_width=64, extension="jpg"):
        print("Create allsky images ...")
        data_directory = os.path.join(self.title_folder, 'projection')
        for order in range(self.max_order + 1):
            width = math.floor(math.sqrt(12 * 4 ** order))
            height = math.ceil(12 * 4 ** order / width)
            result = torch.zeros((edge_width * height, edge_width * width, 3))

            for i in range(12 * 4 ** order):
                file = (
                            data_directory
                            / Path("Norder" + str(order))
                            / Path("Dir" + str(dir_id))
                            / Path("Npix" + str(i) + "." + extension)

                        )
                if not file.exists():
                    raise RuntimeError("File not found: " + str(file))

                image = torch.swapaxes(torch.Tensor(io.imread(file)), 0, 2) / 255.0
                image = transforms.functional.resize(image, [64, 64], antialias=True)
                image = torch.swapaxes(image, 0, 2)

                x = i % width
                y = math.floor(i / width)
                result[
                    y * edge_width: (y + 1) * edge_width,
                    x * edge_width: (x + 1) * edge_width,
                ] = image
            image = Image.fromarray(
                (np.clip(result.numpy(), 0, 1) * 255).astype(np.uint8), mode="RGB"
            )
            image.save(data_directory / Path("Norder" + str(order)) / Path("Allsky.jpg"))
        print("Create allsky images ... done.")

    def make_hips_hierarchy(self, data_path, circle=True):
        self.check_folders("projection")
        self.create_folders("projection")
        self.create_hips_properties("projection")
        self.create_index_file("projection")

        dataset = get_data_np(data_path)
        ds_idx = 0
        dataset_length = dataset.shape[0]

        print("Creating Healpix tiles...")
        for order in range(self.max_order+1):
            n_side = 2**(order)
            n_pix = 12 * n_side**2

            for pix in range(n_pix):
                if circle or ds_idx < dataset_length:
                    data = dataset[ds_idx % dataset_length]
                    ds_idx += 1
                else:
                    data = np.ones((3, self.output_size, self.output_size))
                    data[0] = data[0] * 77.0  # deep purple
                    data[1] = data[1] * 0.0
                    data[2] = data[2] * 153.0
                    data = np.swapaxes(data, 0, 2)

                image = Image.fromarray((data.astype(np.uint8)))
                image = crop_center(image, self.crop_size, self.crop_size)
                image = image.resize((512, 512))
                image.save(os.path.join(self.output_folder, self.title, "projection", "Norder" + str(order),
                                        "Dir" + str(int(math.floor(pix / 10000)) * 10000), "Npix" + str(pix) + ".jpg"))
        print("...done.")


def get_data_dict(path, catalog, test_plot=False):
    data = {}
    for ident in catalog[:,0]:
        ident = int(ident)
        img = torch.tensor(np.array( Image.open(os.path.join(path, '{0}.png'.format(ident)))))
        data[ident] = torch.swapaxes(img[:,:,:3], 0, 2)
    # img_array = np.stack(img_array, axis=0)
    if test_plot:
        plt.imshow(data.values()[0])
        plt.show()
    return data


def get_data_np(path):
    file_names = sorted(glob.glob("{0}/*.png".format(path)))
    # img_array = np.array([np.array(fits.getdata(fname)) for fname in file_names])
    img_array = np.array([np.array(Image.open(fname))[:,:,:3] for fname in file_names])
    return img_array


def crop_center(img, cropx, cropy):
    width, height = img.size
    left = (width - cropx) / 2
    top = (height - cropy) / 2
    right = (width + cropx) / 2
    bottom = (height + cropy) / 2

    # Crop the center of the image
    return img.crop((left, top, right, bottom))

output_size=512,
if __name__ == "__main__":
    data_path = "/home/kollasfa/_DATA/tng-example/tng100-1_example_data/cutouts"
    catalog_path = "/home/kollasfa/_DATA/tng-example/tng100-1_example_data/catalog.csv"
    base_path = '/home/kollasfa/jasmine/web'
    title = 'tng-test'
    hipster = Hipster(output_folder=base_path, title=title, max_order=3, crop_size=350, catalog_file=catalog_path)
    hipster.make_hips_hierarchy(data_path)
    hipster.create_hips_properties('projection')
    hipster.create_allsky()