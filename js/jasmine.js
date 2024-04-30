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
const jsm_gas_features_div = document.getElementById('jsm-feature-selector-gas')
const jsm_dm_features_div = document.getElementById('jsm-feature-selector-dm')
const jsm_stars_features_div = document.getElementById('jsm-feature-selector-stars')
const jsm_feature_radios = document.getElementsByClassName('jsm-feature-radio')



function hide_all_feature_divs() {
    jsm_gas_features_div.style = "display: none;"
    jsm_dm_features_div.style = "display: none;"
    jsm_stars_features_div.style = "display: none;"
}


function change_jasmine_view() {
    jasmine_div.style.backgroundImage = "";
    let active_jasmine_radio = document.querySelector('input[name="jasmine-layer-radio"]:checked');
    let cube_side = active_jasmine_radio.value;
    pc.clear_scene()
    hide_all_feature_divs()
    fetch(csv_url).then(response => response.text())
        .then(
            data => {
                let rows = data.split('\n')
                let sh_id = rows[csv_idx+1].split('\t')[1]
                if(cube_side == "gascloud") {
                    jsm_gas_features_div.style="display: flex;"
                    display_gascloud(sh_id)
                } else if(cube_side == "mock") {
                    display_mock(sh_id)
                } else if(cube_side == "darkmatter") {
                    jsm_dm_features_div.style="display: flex;"
                    display_dmcloud(sh_id)
                } else if(cube_side == "stars") {
                    jsm_stars_features_div.style="display: flex;"
                    display_stars(sh_id);
                }

            }
        )
}

/* Display functions */
function display_gascloud(subhalo_id) {
    let feature = document.querySelector('input[name="jasmine-gas-radio"]:checked').value;
    pc.draw_point_cloud(cube_url, 'gas', feature, subhalo_id)
    if("" + subhalo_id == "undefined") {
        infotext.innerText = "No data point in this cell."
    } else {
        infotext.innerText = "3D Visualisation of gas emitted by galaxy " + subhalo_id;
    }
}

function display_dmcloud(subhalo_id) {
    let feature = document.querySelector('input[name="jasmine-dm-radio"]:checked').value;
    pc.draw_point_cloud(cube_url, 'dm', feature, subhalo_id)
    if("" + subhalo_id == "undefined") {
        infotext.innerText = "No data point in this cell."
    } else {
        infotext.innerText = "3D Visualisation of dark matter potential emitted by galaxy " + subhalo_id;
    }
}

function display_stars(subhalo_id) {
    let feature = document.querySelector('input[name="jasmine-stars-radio"]:checked').value;
    pc.draw_point_cloud(cube_url, 'stars', feature, subhalo_id)
    if("" + subhalo_id == "undefined") {
        infotext.innerText = "No data point in this cell."
    } else {
        infotext.innerText = "3D Visualisation of stellar material in galaxy " + subhalo_id;
    }
}

function display_mock(subhalo_id) {
    display_image(cube_url + "/mock/" + subhalo_id + ".jpg", subhalo_id, "Mock Image")
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
        change_jasmine_view()
    })
}
// Jasmine Feature Change
for(let i=0; i < jsm_feature_radios.length; i++) {
    jsm_feature_radios[i].addEventListener('change', function(e) {
        change_jasmine_view()
    })
}
