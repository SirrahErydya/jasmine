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

    def create_index_file(self, base_folder):
        """Generates the 'index.html' file that contains a direct access to the HiPS tiling via
            aladin lite.

        Args:
            base_folder (String): The place where to create the 'index.html' file.
        """
        print("creating index.html:")
        with open(
            os.path.join(self.output_folder, self.title, base_folder, "index.html"),
            "w",
            encoding="utf-8",
        ) as output:
            output.write("<!DOCTYPE html>\n")
            output.write("<html>\n")
            output.write("<head>\n")
            output.write(
                "<meta name='description' content='custom HiPS of "
                + self.title
                + "'>\n"
            )
            output.write("  <meta charset='utf-8'>\n")
            output.write("<meta name='viewport' content='width=device-width, height=device-height, initial-scale=1.0, user-scalable=no'>")
            output.write(
                "  <title>HiPSter representation of " + self.title + "</title>\n"
            )
            output.write("</head>\n")
            output.write("<body>\n")
            output.write(
                "    <div id='aladin-lite-div' style='width:500px;height:500px;'></div>\n"
            )
            output.write(
                "    <script type='text/javascript' "
                + "src='http://localhost:8000/aladin-lite/dist/aladin.umd.cjs' "
                + "charset='utf-8'></script>\n"
            )
            output.write("    <script type='text/javascript'>\n")
            output.write("        var aladin;\n")
            output.write("	    A.init.then(() => {\n")
            output.write("            aladin = A.aladin('#aladin-lite-div', {fullScreen: true});\n")
            # TODO: check this current hack for the tile location!!!
            output.write(
                "            aladin.setImageSurvey(aladin.createImageSurvey("
                + "'"
                + self.title
                + "', "
                + "'sphere projection of data from "
                + self.title
                + "', "
                + "'"
                + self.hipster_url
                + "/web/"
                + self.title
                + "/"
                + base_folder
                + "',"
                + "'equatorial', "
                + str(self.max_order)
                + ", {imgFormat: 'jpg'})); \n"
            )
            output.write("            aladin.setFoV(180.0); \n")
            output.write("        });\n")
            output.write("    </script>\n")
            output.write("</body>\n")
            output.write("</html>")
            output.flush()

    def calculate_pixels(self, matrix, pixel):
        size = matrix.shape[0]
        if size > 1:
            matrix[: size // 2, : size // 2] = self.calculate_pixels(
                matrix[: size // 2, : size // 2], pixel * 4
            )
            matrix[size // 2 :, : size // 2] = self.calculate_pixels(
                matrix[size // 2 :, : size // 2], pixel * 4 + 1
            )
            matrix[: size // 2, size // 2 :] = self.calculate_pixels(
                matrix[: size // 2, size // 2 :], pixel * 4 + 2
            )
            matrix[size // 2 :, size // 2 :] = self.calculate_pixels(
                matrix[size // 2 :, size // 2 :], pixel * 4 + 3
            )
        else:
            matrix = pixel
        return matrix

    def project_data(self, data, order, pixel):
        if not self.distortion_correction:
            data = functional.resize(
                data, [self.output_size, self.output_size], antialias=True
            )  # scale
            data = torch.swapaxes(data, 0, 2)
            return data
        data = torch.swapaxes(data, 0, 2)
        result = torch.zeros(
            (self.output_size, self.output_size, 3)
        )  # * torch.tensor((77.0/255.0, 0.0/255.0, 153.0/255.0)).reshape(3,1).T[:,None]
        healpix_pixel = torch.zeros(
            (self.output_size, self.output_size), dtype=torch.int64
        )
        healpix_pixel = self.calculate_pixels(healpix_pixel, pixel)
        center_theta, center_phi = healpy.pix2ang(
            2**order, pixel, nest=True
        )  # theta 0...180 phi 0...360
        size = data.shape[0]
        max_theta = max_phi = 2 * math.pi / (4 * 2**order) / 2
        for x in range(self.output_size):
            for y in range(self.output_size):
                target_theta, target_phi = healpy.pix2ang(
                    2**order * self.output_size, healpix_pixel[x, y], nest=True
                )
                delta_theta = target_theta - center_theta
                if center_phi == 0 and target_phi > math.pi:
                    delta_phi = (target_phi - center_phi - 2 * math.pi) * math.sin(
                        target_theta
                    )
                else:
                    delta_phi = (target_phi - center_phi) * math.sin(target_theta)
                target_x = int(size // 2 + delta_phi / max_phi * (size // 2 - 1))
                target_y = int(size // 2 + delta_theta / max_theta * (size // 2 - 1))
                if (
                    target_x >= 0
                    and target_y >= 0
                    and target_x < size
                    and target_y < size
                ):
                    result[x, y] = data[target_x, target_y]
                # else:
                #     result[x,y] = 0
        return result

    def generate_tile(self, data, order, pixel, hierarchy, index):
        if hierarchy <= 1:
            vector = healpy.pix2vec(2**order, pixel, nest=True)
            vector = torch.tensor(vector).reshape(1, 3).type(dtype=torch.float32)
            with torch.no_grad():
                reconstruction = data[index]  # model.reconstruct(vector)[0]
            return self.project_data(reconstruction, order, pixel)
        q1 = self.generate_tile(data, order + 1, pixel * 4, hierarchy / 2, index * 4)
        q2 = self.generate_tile(
            data, order + 1, pixel * 4 + 1, hierarchy / 2, index * 4 + 1
        )
        q3 = self.generate_tile(
            data, order + 1, pixel * 4 + 2, hierarchy / 2, index * 4 + 2
        )
        q4 = self.generate_tile(
            data, order + 1, pixel * 4 + 3, hierarchy / 2, index * 4 + 3
        )
        result = torch.ones((q1.shape[0] * 2, q1.shape[1] * 2, 3))
        result[: q1.shape[0], : q1.shape[1]] = q1
        result[q1.shape[0] :, : q1.shape[1]] = q2
        result[: q1.shape[0], q1.shape[1] :] = q3
        result[q1.shape[0] :, q1.shape[1] :] = q4
        return result

    def transform_csv_to_votable(self):
        print("Transforming catalog.csv to votable ...")

        table = Table.read(self.catalog_file, format="ascii.csv")
        writeto(table, str(self.votable_file))

        print("Transforming catalog.csv to votable ... done.")

    def calculate_healpix_cells(self, catalog, numbers, order, pixels):
        healpix_cells = {}  # create an extra map to quickly find images in a cell
        for pixel in pixels:
            healpix_cells[pixel] = []  # create empty lists for each cell
        for number in numbers:
            pixel = healpy.vec2pix(
                2**order,
                catalog[number][1],
                catalog[number][2],
                catalog[number][3],
                nest=True,
            )
            if pixel in healpix_cells:
                healpix_cells[pixel].append(int(number))
        return healpix_cells

    def embed_tile(self, dataset, catalog, order, pixel, hierarchy, idx):
        if hierarchy <= 1:
            if len(idx) == 0:
                data = torch.ones((3, self.output_size, self.output_size))
                data[0] = data[0] * 77.0 / 255.0  # deep purple
                data[1] = data[1] * 0.0 / 255.0
                data[2] = data[2] * 153.0 / 255.0
                data = torch.swapaxes(data, 0, 2)
            else:
                vector = healpy.pix2vec(2**order, pixel, nest=True)
                distances = np.sum(
                    np.square(catalog[np.array(idx)][:, 3:6] - vector), axis=1
                )
                best = idx[np.argmin(distances)]
                data = dataset[int(catalog[best][0])]
                data = functional.center_crop(
                    data, [self.crop_size, self.crop_size]
                )  # crop
                data = self.project_data(data, order, pixel)
            return data
        healpix_cells = self.calculate_healpix_cells(
            catalog, idx, order + 1, range(pixel * 4, pixel * 4 + 4)
        )
        q1 = self.embed_tile(
            dataset,
            catalog,
            order + 1,
            pixel * 4,
            hierarchy / 2,
            healpix_cells[pixel * 4],
        )
        q2 = self.embed_tile(
            dataset,
            catalog,
            order + 1,
            pixel * 4 + 1,
            hierarchy / 2,
            healpix_cells[pixel * 4 + 1],
        )
        q3 = self.embed_tile(
            dataset,
            catalog,
            order + 1,
            pixel * 4 + 2,
            hierarchy / 2,
            healpix_cells[pixel * 4 + 2],
        )
        q4 = self.embed_tile(
            dataset,
            catalog,
            order + 1,
            pixel * 4 + 3,
            hierarchy / 2,
            healpix_cells[pixel * 4 + 3],
        )
        result = torch.ones((q1.shape[0] * 2, q1.shape[1] * 2, 3))
        result[: q1.shape[0], : q1.shape[1]] = q1
        result[q1.shape[0] :, : q1.shape[1]] = q2
        result[: q1.shape[0], q1.shape[1] :] = q3
        result[q1.shape[0] :, q1.shape[1] :] = q4
        return result

    def generate_dataset_projection(self, data_path):
        """Generates a HiPS tiling by using the coordinates of every image to map the original
            images form the data set based on their distance to the closest heal pixel cell
            center.

        Args:
            datamodule (SpherinatorDataModule): The datamodule to access the original images
        """
        print("Generating dataset projection ...")

        self.check_folders("projection")
        self.create_folders("projection")
        self.create_hips_properties("projection")
        self.create_index_file("projection")

        catalog = pd.read_csv(
            self.catalog_file,
            usecols=["id", "x", "y", "z"],
        ).to_numpy()

        dataset = get_data_dict(data_path, catalog)

        for i in range(self.max_order + 1):
            healpix_cells = self.calculate_healpix_cells(
                catalog, range(catalog.shape[0]), i, range(12 * 4**i)
            )
            print(
                "\n  order "
                + str(i)
                + " ["
                + str(12 * 4**i).rjust(
                    int(math.log10(12 * 4**self.max_order)) + 1, " "
                )
                + " tiles]:",
                end="",
            )


            for j in range(12*4**i):
                data = self.embed_tile(dataset, catalog, i, j, self.hierarchy, healpix_cells[j])
                image = Image.fromarray((data.detach().numpy().astype(np.uint8)))
                image.save(os.path.join(self.output_folder, self.title, "projection", "Norder"+str(i),
                                        "Dir"+str(int(math.floor(j/10000))*10000), "Npix"+str(j)+".jpg"))

            print("Generating dataset projection ... done.")

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
    healpy.ang2pix(0, 90, 90)
    hipster.create_allsky()