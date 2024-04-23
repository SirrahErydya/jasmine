import {HealpixIndex} from "../aladin-lite/src/js/libs/healpix";
import * as pc from "/js/point_cloud"
import {func} from "three/addons/nodes/code/FunctionNode";
import * as hdf5 from 'jsfive'
import csv from "csvtojson";
import {sub} from "three/nodes";

let aladin;
let csv_url = ""
let csv_idx = 0

const survey_url = 'http://localhost:5173/surveys/TNG100-h2/'
const model_url = survey_url + 'model'
const projection_url = survey_url + 'projection'
const cat_url = survey_url + 'interaction_catalog'
const cube_url = survey_url + 'data_cube'
const hierarchy = 1

/* Some HTML Elements */
const infotext = document.getElementById('infobox')
const jasmine_div = document.getElementById('jasmine-viewer')
const jsm_layer_radios = document.getElementsByName("jasmine-layer-radio")
let active_jasmine_radio = document.querySelector('input[name="jasmine-layer-radio"]:checked');





function choose_datapoint(event) {
    let order = aladin.view.wasm.getNOrder() 
    let radec = aladin.pix2world(event.x, event.y)
    let theta =  Math.PI / 2. - radec[1] / 180. * Math.PI;
    let phi = radec[0] / 180. * Math.PI
    let top_index = new HealpixIndex(2**order)
    top_index.init()
    let top_pixel = top_index.ang2pix_nest(theta, phi)
    if(hierarchy > 0) {
        let nested_index = new HealpixIndex(2**(order+hierarchy))
        nested_index.init()
        csv_idx = nested_index.ang2pix_nest(theta, phi) - 4*top_pixel
    }
    csv_url = cat_url + '/Norder'+ order + '/Dir0/Npix' + top_pixel + '.tsv';
    change_jasmine_view()
}


function change_jasmine_view() {
    jasmine_div.style.backgroundImage = "";
    let cube_side = active_jasmine_radio.value;
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
                } else if(cube_side == "darkmatter") {
                    display_dmcloud(sh_id)
                } else if(cube_side == "gas_temperature") {
                    display_gas_temperature(sh_id)
                } else if(cube_side == "stars") {
                    display_stars(sh_id);
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

function display_dmcloud(subhalo_id) {
    let data_url = cube_url + "/dm_pointclouds/" + subhalo_id + ".ply"
    pc.draw_point_cloud(data_url)
    if("" + subhalo_id == "undefined") {
        infotext.innerText = "No data point in this cell."
    } else {
        infotext.innerText = "3D Visualisation of dark matter potential emitted by galaxy " + subhalo_id;
    }
}

function display_stars(subhalo_id) {
    let data_url = cube_url + "/stars/" + subhalo_id + ".ply"
    pc.draw_point_cloud(data_url)
    if("" + subhalo_id == "undefined") {
        infotext.innerText = "No data point in this cell."
    } else {
        infotext.innerText = "3D Visualisation of stellar material in galaxy " + subhalo_id;
    }
}

function display_morphology(subhalo_id) {
    display_image(cube_url + "/morphology/" + subhalo_id + ".jpg", subhalo_id, "Morphology")
}

function display_dark_matter(subhalo_id) {
    display_image(cube_url + "/dark_matter_fields/" + subhalo_id + ".png", subhalo_id, "Dark Matter")
}

function display_gas_temperature(subhalo_id) {
    display_image(cube_url + "/gas_temperature_fields/" + subhalo_id + ".png", subhalo_id, "Gas Temperature")
}

function  display_image(data_url, subhalo_id, aspect) {
    jasmine_div.style.backgroundImage = "url('" + data_url + "')";
    if("" + subhalo_id == "undefined") {
        infotext.innerText = "No data point in this cell."
    } else {
        infotext.innerText = aspect + " of galaxy " + subhalo_id;
    }
}

/** Event listeners **/
window.addEventListener("message",
    (e) => {
        if(e.origin === "http://localhost:5173" && e.data) {
            csv_url = e.data['csv_url']
            csv_idx = e.data['csv_idx']
            change_jasmine_view()
        }
    })

// Jasmine Layer Change
for(let i=0; i < jsm_layer_radios.length; i++) {
    jsm_layer_radios[i].addEventListener('change', function(e) {
        active_jasmine_radio = this
        change_jasmine_view()
    })
}
