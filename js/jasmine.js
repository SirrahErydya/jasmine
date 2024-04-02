import {HealpixIndex} from "../aladin-lite/src/js/libs/healpix";
import * as pc from "/js/point_cloud"
import {func} from "three/addons/nodes/code/FunctionNode";
import * as hdf5 from 'jsfive'
import csv from "csvtojson";

let aladin;
let moved_while_pressed = false;

const survey_url = 'http://localhost:5173/surveys/TNG100-h2/'
const model_url = survey_url + 'model'
const projection_url = survey_url + 'projection'
const cat_url = survey_url + 'interaction_catalog'
const cube_url = survey_url + 'data_cube'
const hierarchy = 1

/* Some HTML Elements */
const infotext = document.getElementById('infobox')
const aladin_div = document.getElementById('aladin-lite-div')
const jasmine_div = document.getElementById('jasmine-viewer')
const datatype_select = document.getElementById('datatype')




A.init.then(() => {
    aladin = A.aladin('#aladin-lite-div');
    let model_survey = aladin.createImageSurvey('TNG100 Model',
        'a model trained on Illustris data', model_url,
        'equatorial', 3, {imgFormat: 'jpg'})
    let projection_survey = aladin.createImageSurvey('TNG100 Projection',
        'data from Illustris', projection_url,
        'equatorial', 3, {imgFormat: 'jpg'})
    let prog =  A.catalogHiPS(cat_url, {name: 'Data Points', sourceSize: 8, raField: 'ra', decField: 'dec'});
    let catalog = A.catalogFromURL('http://localhost:5173/surveys/TNG100/catalog.vot', {sourceSize:10, onClick: 'showPopup', color: 'cyan', shape: 'circle', name: 'TNG100'});
    aladin.addCatalog(catalog);
    aladin.setOverlayImageLayer(model_survey);
    aladin.setBaseImageLayer(projection_survey);
    aladin.addCatalog(prog);
    aladin.setFoV(180.0);
    /*
    aladin.on('mouseMove', function (e) {
        let order = aladin.view.wasm.getNOrder()
        let radec = aladin.pix2world(e.x, e.y)
        update_hp_index(radec[0], radec[1], 2**order)
    })*/

});

function change_jasmine_view(event) {
    let order = aladin.view.wasm.getNOrder() 
    let radec = aladin.pix2world(event.x, event.y)
    let theta =  Math.PI / 2. - radec[1] / 180. * Math.PI;
    let phi = radec[0] / 180. * Math.PI
    let top_index = new HealpixIndex(2**order)
    top_index.init()
    let top_pixel = top_index.ang2pix_nest(theta, phi)
    let csv_idx = 0
    if(hierarchy > 0) {
        let nested_index = new HealpixIndex(2**(order+hierarchy))
        nested_index.init()
        csv_idx = nested_index.ang2pix_nest(theta, phi) - 4*top_pixel
    }
    let csv_url = cat_url + '/Norder'+ order + '/Dir0/Npix' + top_pixel + '.tsv';
    let dtype = datatype_select.value
    display_data(csv_url, dtype, csv_idx)
}

function display_data(csv_url, cube_side, csv_idx) {
    jasmine_div.style.backgroundImage = "";
    pc.clear_scene()
    fetch(csv_url).then(response => response.text())
        .then(
            data => {
                let rows = data.split('\n')
                let sh_id = rows[csv_idx+1].split('\t')[1]
                if(cube_side == "gascloud") {
                    display_gascloud(sh_id)
                } else if(cube_side == "morphology") {
                    display_morphology(sh_id)
                } else if(cube_side == "dm_field") {
                    display_dm_field(sh_id)
                } else if(cube_side == "gas_temperature") {
                    display_gas_temperature(sh_id)
                }

            }
        )
}

/* Display functions */
function display_gascloud(subhalo_id) {
    let data_url = cube_url + "/gas_pointclouds/" + subhalo_id + ".ply"
    pc.draw_point_cloud(data_url)
    if("" + subhalo_id == "undefined") {
        infotext.innerText = "No data point in this cell."
    } else {
        infotext.innerText = "3D Visualisation of gas potential emitted by galaxy " + subhalo_id;
    }
}

function display_morphology(subhalo_id) {
    display_image(cube_url + "/morphology/" + subhalo_id + ".jpg")
}

function display_dm_field(subhalo_id) {
    display_image(cube_url + "/dark_matter_fields/" + subhalo_id + ".png")
}

function display_gas_temperature(subhalo_id) {
    display_image(cube_url + "/gas_temperature_fields/" + subhalo_id + ".png")
}

function  display_image(data_url) {
    jasmine_div.style.backgroundImage = "url('" + data_url + "')";
    if("" + subhalo_id == "undefined") {
        infotext.innerText = "No data point in this cell."
    } else {
        infotext.innerText = "Morphology of galaxy " + subhalo_id;
    }
}


// Add an event for the change of the Jasmine view - On right click
aladin_div.addEventListener("mouseup", function(e) {
    if(e.button === 2) {
        change_jasmine_view(e)
    }
})
