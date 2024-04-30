# Jasmine Demo Deployment

Here is a full description about setting up a Jasmine Demo from Scratch

## Create Survey folder
1. Download some data from Illustris. Make sure you download, for each data point:
	* A FITS stellar mock image
	* The full HDF5 file
   And for the whole data set a .csv file with scientific information.
   This [Jupyter Notebook](https://github.com/SirrahErydya/jasmine/blob/webdemo/get-tng-multidim.ipynb) will help you downloading the data correctly
2. Checkout the branch [multidimensions](https://github.com/HITS-AIN/Spherinator/tree/multidimensions) from the [Spherinator](https://github.com/HITS-AIN/Spherinator) repository
3. Navigate to `experiments/tng_multidim_power.yaml` and adjust the parameters holding the path to your data and info.csv
4. Train a Spherinator model with this configuration
5. Run `make_jasmine_survey.py`, giving the path to the trained model as a parameter

## Deploy Jasmine Demo
1. Clone the [Jasmine Repository](https://github.com/SirrahErydya/jasmine) and checkout the [webdemo](https://github.com/SirrahErydya/jasmine/tree/webdemo) branch
2. Navigate into the top folder of the repository and create a folder named `surveys`
3. Paste the survey folder from the previous steps into `surveys`
4. Open a terminal inside the top folder and install all `Node.js` requirements via `npm install`
5. Run a demo webserver with `npx vite`
6. Open the local address (usually `localhost:5173`) with your browser
Enjoy Jasmine!
