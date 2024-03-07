import {HealpixIndex} from "../aladin-lite/src/js/libs/healpix";
import * as pc from "/js/point_cloud"

let aladin;
let current_hp_index;

const index_changed_event = new Event("indexChanged")

function update_hp_index(ra, dec, nside) {
    let hp_index = new HealpixIndex(nside)
    hp_index.init()
    let theta =  Math.PI / 2. - dec / 180. * Math.PI;
    let phi = ra / 180. * Math.PI
    //console.log("Theta: " + theta)
    //console.log("Phi: " + phi)
    let idx = hp_index.ang2pix_nest(theta, phi)
    //console.log("HP Index:" + idx)
    if(idx !== current_hp_index) {
        current_hp_index = idx;
        document.dispatchEvent(index_changed_event)
    }
}
A.init.then(() => {
    aladin = A.aladin('#aladin-lite-div');
    aladin.setImageSurvey(aladin.createImageSurvey('tng-test',
        'sphere projection of data from tng-test', 'http://localhost:5173/surveys/tng-test',
        'equatorial', 3, {imgFormat: 'jpg'}));
    aladin.setFoV(180.0);
    aladin.on('mouseMove', function (e) {
        let order = aladin.view.wasm.getNOrder()
        let radec = aladin.pix2world(e.x, e.y)
        update_hp_index(radec[0], radec[1], 2**order)
    })
});

document.addEventListener('indexChanged', ()=>{
    pc.draw_point_cloud('/surveys/tng-test/Norder0/Dir0/Ncloud0.ply')
})
