# Jasmine
An extension to ALADIN Lite that suits for exploring data sets rather than full sky images.

* Explore a large data set by interacting with a **hierarchical sphere projection**
  * Each data point is projected to the sphere's surface according to their **morphology**
  * Increasing the granularity by zooming in loads more data points in real time
* Inspect individual data points
  * Choose between **3D** and **2D** representations
  * Highlight data attributes such as potential, density, metallicity, or velocity
  
This project is currently under development. We provide a demo version to give an idea about our vision.

## Features in development
* Brush and link concept to mark properties of interest and find data points with similar properties
* Support for arbitrary data types, including types as spectral data or time series
* Full-grown pipeline to create and manage surveys, supported by a Jupyter Scripting Interface
* Interfaces to common data analysis tools from astronomy

## Demo setup
1. Download an example survey [here](https://drive.google.com/file/d/1NuTxCRF9JetEjGNFhERXDurtJO56h8lJ/view?usp=drive_link).
2. Clone the repository and checkout the [webdemo](https://github.com/SirrahErydya/jasmine/tree/webdemo) branch
3. Navigate into the top folder of the repository and clone the [aladin-lite submodule](https://github.com/SirrahErydya/aladin-lite/tree/develop)
4. Install `aladin lite` according to the instructions given bzy the Readme file.
5. Navigate back to the `jasmine` top folder and create a folder named *surveys*
6. Paste the example survey folder into *surveys*
7. Open a terminal inside the top folder and install all `Node.js` requirements via `npm install`
8. Run a demo webserver with `npx vite`
9. Open the local address (usually `localhost:5173`) with your browser
10. Enjoy Jasmine!
