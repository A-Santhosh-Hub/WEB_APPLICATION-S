# **🗺️ Smart Fuel Route Planner**

An advanced, GPS-aware intelligent vehicle navigation assistant. This is not just a static calculator—it is a live routing engine that calculates your exact fuel range, predicts where you will run out of fuel along your route, and automatically scans the live OpenStreetMap database to find nearby petrol bunks and emergency services.

**Built 100% free of paid API keys using open-source mapping technologies.**


## **✨ Core Features**

* **⛽ Smart Fuel Range Engine:** Inputs your vehicle type, mileage, and current fuel to dynamically calculate if you can safely reach your destination.  
* **📍 Predictive Exhaustion Point:** Uses path interpolation to find the exact geographical coordinate where your vehicle will run out of fuel (marked with a Yellow alert circle).  
* **📡 Live Petrol Bunk Intelligence:** Automatically pings the Overpass API to find real petrol stations within an 8km radius of your fuel exhaustion point.  
* **🚨 Live Proximity Tracking:** Actively tracks your GPS movement. If you drive within **1 kilometer** of running out of fuel, it triggers an aggressive Red visual alert.  
* **⏱️ Live Speedometer:** Calculates real-time speed in KM/H using device GPS sensors.  
* **🏥 Emergency Places Overlay:** Quick-access chips to instantly map nearby **Hospitals**, **Food/Restaurants**, and **Mechanics** (Indian-optimized tagging search).  
* **💳 Trip Cost Estimator:** Toggle between Petrol and Diesel to instantly calculate total tank value and estimated trip cost.  
* **📱 OriginOS / Android 16 UI:** Features a mobile-first, highly elastic user interface. Includes glassmorphism (blur) panels, draggable bottom sheets, floating widgets, and smooth micro-animations.

## **🛠️ Technology Stack**

This project was built to bypass the expensive Google Maps Platform while delivering the exact same premium functionality.

* **Frontend:** HTML5, CSS3 (Advanced custom properties & glassmorphism), Vanilla JS (ES6+ modular architecture).  
* **Map Engine:** [Leaflet.js](https://leafletjs.com/) (Interactive maps) & CartoDB Dark Tiles.  
* **Routing API:** [OSRM (Open Source Routing Machine)](http://project-osrm.org/) for highly accurate polyline road routing.  
* **Geocoding:** [Nominatim API](https://nominatim.org/) (biased towards India/Tamil Nadu for fast searching).  
* **Live Places Database:** [Overpass API (OpenStreetMap)](https://wiki.openstreetmap.org/wiki/Overpass_API) for live queries of fuel bunks, hospitals, and mechanics.  
* **Icons:** [Phosphor Icons](https://phosphoricons.com/).

## **🚀 How It Works (The Intelligence)**

1. **Routing:** You enter a start and end destination. The app fetches the road coordinates via OSRM.  
2. **Distance Interpolation:** The JS engine uses the Haversine formula to iterate over the route polyline. It stops exactly when the accumulated distance equals your Fuel × Mileage.  
3. **Live Fetch:** At that precise coordinate, it sends an Overpass API query: node(around:8000,lat,lng)\["amenity"="fuel"\] to find actual bunks to save you.  
4. **Fallback Safety:** Uses an aggressive array of 4 different Overpass endpoint URLs to bypass public API rate-limiting errors.

## **💻 Installation & Setup**

Because this project uses a powerful **Single-File Architecture** with no build steps or bundlers required, setup is instant.

1. Download repository: 

2. Open the folder.  
3. Double click index.html to open it in any modern web browser (Chrome/Safari/Firefox).  
4. *(Optional)* For the best experience, host it using VS Code Live Server or deploy it directly to GitHub Pages to test the Live GPS tracking on your mobile device.

# 5. However:

❌ Do NOT remove SanStudio credit and upload the same project as your own without meaningful improvements

❌ Do NOT simply rename and re-publish the project

❌ Do NOT claim authorship of unchanged work

## **📱 Responsive Design**

* **Mobile Primary:** Features a draggable bottom sheet that intelligently auto-collapses when a route is drawn so the map is never obstructed.  
* **Desktop Optimized:** The bottom sheet automatically converts into a floating side-panel for widescreen monitors.

## **🤝 Contribution & License**

Contributions, issues, and feature requests are welcome\! Feel free to check the [issues page](https://www.google.com/search?q=https://github.com/YOUR_GITHUB_USERNAME/smart-fuel-route-planner/issues).

**License:** MIT License. Feel free to use this for educational purposes or extend it for your own portfolio.

![Viewer Screenshot](https://github.com/A-Santhosh-Hub/WEB_APPLICATION-S/blob/main/SMART-FUEL-ROUTE-PLANNER/Location.png)
