import {HealpixIndex} from "../aladin-lite/src/js/libs/healpix";
import {func} from "three/addons/nodes/code/FunctionNode";

let survey_url = document.getElementById('survey_url').value
let hierarchy = 1
let window_mode = document.querySelector('input[name="window-settings"]:checked').value;
let jasmine_window;

// URLs
const model_url = survey_url + 'model'
const projection_url = survey_url + 'projection'
const cat_url = survey_url + 'interaction_catalog'
const cube_url = survey_url + 'data_cube'

let aladin;

// DOM Elements
const aladin_div = document.getElementById('aladin-lite-div')
const aladin_layer_radios = document.getElementsByName("aladin-layer-radio")
const window_settings = document.getElementsByName('window-settings')

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
    let csv_idx;
    if(hierarchy > 0) {
        let nested_index = new HealpixIndex(2**(order+hierarchy))
        nested_index.init()
        csv_idx = nested_index.ang2pix_nest(theta, phi) - 4*top_pixel
    }
    let csv_url = cat_url + '/Norder'+ order + '/Dir0/Npix' + top_pixel + '.tsv';
    return {
        "csv_url": csv_url,
        "csv_idx": csv_idx
    }
}


/** Event listeners **/
aladin_div.addEventListener("mouseup", function(e) {
    if(e.button === 2) {
        let data = choose_datapoint(e)
        if (!jasmine_window || window_mode == "multi-modal") {
            jasmine_window = window.open(
                'http://localhost:5173/modals/jasmine-viewer.html', '_blank',
                'location=yes,height=1000,width=1000,top=0,left=1500,scrollbars=no');
            jasmine_window.addEventListener('load', e => jasmine_window.postMessage(data));
        } else {
            // Just JavaScript being JavaScript I guess...
            jasmine_window.postMessage(data);
        }

    }
})

// Aladin Layer change
for(let i=0; i < aladin_layer_radios.length; i++) {
    aladin_layer_radios[i].addEventListener('change', function(e) {
        let survey_id = this.value;
        aladin.setBaseImageLayer(survey_id)
    })
}

// Window setting change
for(let i=0; i < window_settings.length; i++) {
    window_settings[i].addEventListener('change', function(e){
        window_mode = this.value;
    })
}

