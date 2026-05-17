"use strict";

function getElement(selector) {
    return document.querySelector(selector);
}

// returns date string in YYYY-MM-DD format - default param value is today's date
function getDateString(dt = new Date()) {
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

async function getPicture(date) {
    const dateString = getDateString(date);
    const domain = `https://api.nasa.gov/planetary/apod`;
    const request = `?api_key=DEMO_KEY&date=${dateString}`;
    const response = await fetch(domain + request);
    return await response.json();  
}

// Fetch Perseverance latest photos
async function getPerseverancePhotosByDate(earthDate) {
    const apiKey = "DEMO_KEY"; // replace with your NASA key if you have one
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error loading Mars Rover images:", error);
        throw error;
    }
}

// Load available dates for Perseverance (2025-2026)
async function loadAvailableDates() {
    const loadingMsg = getElement("#loading-msg");
    const datePicker = getElement("#mars-date-picker");
    
    // Set default date to today (or max date if today is beyond range)
    const today = new Date();
    const maxDate = new Date("2026-05-16");
    
    if (today <= maxDate) {
        datePicker.value = getDateString(today);
    } else {
        datePicker.value = "2026-05-16";
    }
    
    loadingMsg.textContent = "Calendar ready. Select a date to view photos.";
}

function clear() {
    getElement("#apod-title").textContent = "";
    getElement("#apod-display").textContent = "";
    getElement("#apod-explanation").textContent = "";
    getElement("#apod-msg").textContent = "";
    getElement("#mars-title").textContent = "";
    getElement("#mars-date").textContent = "";
    getElement("#mars-camera").textContent = "";
    getElement("#mars-msg").textContent = "";
    getElement("#gallery").innerHTML = "";
}

function displayPicture(data) {
    
    if (data.error) {                          // error
        getElement("#apod-msg").textContent = data.error.message; 
    } 
    else if (data.code) {                     // problem
        getElement("#apod-msg").textContent = data.msg; 
    }      
    else {                                    // success 
        // heading
        getElement("#apod-title").textContent = data.title;

        // image or video
        const displayDiv = getElement("#apod-display");
        if (data.media_type === "image") {
            const img = document.createElement("img");
            img.src = data.url;
            img.alt = "NASA photo";
            img.width = 700;
            displayDiv.appendChild(img);
        } 
        else if (data.media_type === "video") {
            const iframe = document.createElement("iframe");
            iframe.src = data.url;
            iframe.allowFullscreen = true;
            iframe.setAttribute("frameborder", "0");
            displayDiv.appendChild(iframe);
        }

        // text
        getElement("#apod-explanation").textContent = data.explanation;
    }
}

function displayPerseverancePhotos(data) {
    if (data.error) {
        getElement("#mars-msg").textContent = data.error.message;
    }
    else if (data.code === 429 || (data.msg && data.msg.toLowerCase().includes("rate limit"))) {
        getElement("#mars-msg").textContent = 
            "API rate limit reached for DEMO_KEY (30 requests/hour). " +
            "Get a free key at https://api.nasa.gov and replace DEMO_KEY in apod.js.";
    }
    else if (!data.latest_photos || data.latest_photos.length === 0) {
        getElement("#mars-msg").textContent = "No photos found.";
    }
    else {
        // Display all photos in gallery
        data.latest_photos.forEach(photo => {
            const img = document.createElement("img");
            img.src = photo.img_src;
            img.classList.add("rover-photo");
            document.getElementById("gallery").appendChild(img);
        });
        
        // Get info from first photo
        const firstPhoto = data.latest_photos[0];
        getElement("#mars-title").textContent = `Mars Rover: ${firstPhoto.rover.name}`;
        getElement("#mars-date").textContent = `Earth Date: ${firstPhoto.earth_date}`;
        getElement("#mars-camera").textContent = `Camera: ${firstPhoto.camera.full_name}`;
    }
}

function switchTab(tabName) {
    // Hide all sections and deactivate all tabs
    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.remove("active");
    });
    document.querySelectorAll(".tab-button").forEach(button => {
        button.classList.remove("active");
    });
    
    // Show selected section and activate selected tab
    if (tabName === "apod") {
        getElement("#apod-section").classList.add("active");
        getElement("#apod-tab").classList.add("active");
    } else if (tabName === "mars") {
        getElement("#mars-section").classList.add("active");
        getElement("#mars-tab").classList.add("active");
    }
    
    clear();
}

document.addEventListener("DOMContentLoaded", () => {
    // Tab event listeners
    getElement("#apod-tab").addEventListener("click", () => switchTab("apod"));
    getElement("#mars-tab").addEventListener("click", () => switchTab("mars"));
    
    // set text box to today's date in YYYY-MM-DD format 
    const dateTextbox = getElement("#date");
    dateTextbox.value = getDateString();
    dateTextbox.focus();

    // APOD View button
    getElement("#view_button").addEventListener("click", async () => {
        clear();  // clear any previous display
        
        const dateString = getElement("#date").value;
        const date = new Date(dateString);

        if (date == "Invalid Date") {
            const msg = "Please enter a valid date in YYYY-MM-DD format.";
            getElement("#apod-msg").textContent = msg;
        } else {
            try {
                const data = await getPicture(date);
                displayPicture(data);
            } catch(e) {
                getElement("#apod-msg").textContent = e.message;
            }
        }

        getElement("#date").focus();
    });
    
    // Mars Perseverance View button
    getElement("#mars-view-button").addEventListener("click", async () => {
        clear();  // clear any previous display
        
        try {
            getElement("#mars-msg").textContent = "Loading latest Perseverance photos...";
            const data = await getPerseverancePhotosByDate();
            getElement("#mars-msg").textContent = "";
            displayPerseverancePhotos(data);
        } catch(e) {
            getElement("#mars-msg").textContent = "Error: " + e.message;
        }
    });
});