import {HealpixIndex} from "../aladin-lite/src/js/libs/healpix";
import * as pc from "/js/point_cloud"
import {func} from "three/addons/nodes/code/FunctionNode";
import * as hdf5 from 'jsfive'
import csv from "csvtojson";
import {sub} from "three/nodes";

let aladin;
let moved_while_pressed = false;
let csv_url = ""
let csv_idx = 0

const survey_url = 'http://localhost:5173/surveys/TNG100/'
const model_url = survey_url + 'model'
const projection_url = survey_url + 'projection'
const cat_url = survey_url + 'interaction_catalog'
const cube_url = survey_url + 'data_cube'
const hierarchy = 1

/* Some HTML Elements */
const infotext = document.getElementById('infobox')
const aladin_div = document.getElementById('aladin-lite-div')
const jasmine_div = document.getElementById('jasmine-viewer')
const aladin_layer_radios = document.getElementsByName("aladin-layer-radio")
const jsm_layer_radios = document.getElementsByName("jasmine-layer-radio")
let active_jasmine_radio = document.querySelector('input[name="jasmine-layer-radio"]:checked');
const jsm_gas_features_div = document.getElementById('jsm-feature-selector-gas')
const jsm_dm_features_div = document.getElementById('jsm-feature-selector-dm')
const jsm_stars_features_div = document.getElementById('jsm-feature-selector-stars')
const jsm_feature_radios = document.getElementsByClassName('jsm-feature-radio')




A.init.then(() => {
    aladin = A.aladin('#aladin-lite-div', {
        "showGotoControl": false,
        "showLayersControl": false,
        "showProjectionControl": false,
        "showFullscreenControl": false
    });
    let model_survey = aladin.createImageSurvey('TNG100-99-model',
        'TNG100-99 Model', model_url,
        'equatorial', 3, {imgFormat: 'jpg'})
    let projection_survey = aladin.createImageSurvey('TNG100-99-projection',
        'TNG100-99 Morphology Images', projection_url,
        'equatorial', 3, {imgFormat: 'jpg'})
    aladin.setFoV(180.0);
    let survey_to_show = document.querySelector('input[name="aladin-layer-radio"]:checked').value;
    aladin.setBaseImageLayer(survey_to_show);
    /*
    aladin.on('mouseMove', function (e) {
        let order = aladin.view.wasm.getNOrder()
        let radec = aladin.pix2world(e.x, e.y)
        update_hp_index(radec[0], radec[1], 2**order)
    })*/
    aladin.on('rightClickMove', function(e) {
        //e.preventDefault();
        return false;
    })

});





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

// Add an event for the change of the Jasmine view - On right click
aladin_div.addEventListener("mouseup", function(ev) {
    if(ev.button === 2) {
        choose_datapoint(ev)
    }
})

// Aladin Layer change
for(let i=0; i < aladin_layer_radios.length; i++) {
    aladin_layer_radios[i].addEventListener('change', function(e) {
        let survey_id = this.value;
        aladin.setBaseImageLayer(survey_id)
    })
}

// Jasmine Layer Change
for(let i=0; i < jsm_layer_radios.length; i++) {
    jsm_layer_radios[i].addEventListener('change', function(e) {
        active_jasmine_radio = this
        change_jasmine_view()
    })
}

// Jasmine Feature Change
for(let i=0; i < jsm_feature_radios.length; i++) {
    jsm_feature_radios[i].addEventListener('change', function(e) {
        change_jasmine_view()
    })
}
