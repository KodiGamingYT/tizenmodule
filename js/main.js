// js/main.js

/**
 * SystemDashboard object to manage API calls and UI updates.
 * This requires the 'http://tizen.org/privilege/systeminfo' privilege.
 */
var SystemDashboard = {
    updateInterval: null,

    init: function() {
        console.log("System Status Module Initialized. Starting data polling.");
        this.fetchStaticInfo(); // Fetch static info only once
        this.startPolling(2000); // Start polling dynamic data every 2000ms (2 seconds)
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },

    handleKeyDown: function(event) {
        if (event.keyCode === 10009) { // 10009 is the Tizen 'Return' (Back) key
            console.log("Back button pressed. Stopping polling and allowing TizenBrew to exit.");
            clearInterval(this.updateInterval);
        }
    },

    startPolling: function(interval) {
        this.updateDynamicData();
        this.updateInterval = setInterval(this.updateDynamicData.bind(this), interval);
    },

    /**
     * Fetches static information (Model, Version, Display) once on load.
     */
    fetchStaticInfo: function() {
        // Get Model Name and Tizen Version (BUILD property)
        tizen.systeminfo.getPropertyValue('BUILD', 
            function(build) {
                document.getElementById('model-name').textContent = build.model;
                document.getElementById('tizen-version').textContent = `Platform: ${build.platformVersion}`;
            },
            function(error) {
                document.getElementById('model-name').textContent = "Build Info Error";
                console.error("BUILD Info Error:", error.message);
            }
        );

        // Get Display Resolution
        tizen.systeminfo.getPropertyValue('DISPLAY', 
            function(display) {
                document.getElementById('display-resolution').textContent = 
                    `${display.resolutionWidth} x ${display.resolutionHeight} px`;
            },
            function(error) {
                document.getElementById('display-resolution').textContent = "Display Error";
                console.error("Display Info Error:", error.message);
            }
        );
    },

    /**
     * Fetches dynamic data (CPU, Memory, Storage, Network) and updates the UI periodically.
     */
    updateDynamicData: function() {
        // --- 1. Get CPU Load ---
        tizen.systeminfo.getPropertyValue('CPU', 
            function(cpu) {
                const loadPercent = Math.round(cpu.load * 100);
                document.getElementById('cpu-load').textContent = loadPercent + "%";
                document.getElementById('cpu-fill').style.width = loadPercent + "%";
            },
            function(error) {
                document.getElementById('cpu-load').textContent = "CPU Error";
                document.getElementById('cpu-fill').style.width = "0%";
            }
        );

        // --- 2. Get Memory (Total and Available) ---
        tizen.systeminfo.getPropertyValue('MEMORY', 
            function(memory) {
                const totalGB = (memory.capacity / 1024 / 1024).toFixed(2); 
                const availableMB = (memory.availableCapacity / 1024).toFixed(0);
                const usedPercent = Math.round(((memory.capacity - memory.availableCapacity) / memory.capacity) * 100);

                document.getElementById('memory-total').textContent = `${totalGB} GB Total`;
                document.getElementById('memory-available').textContent = `${availableMB} MB Free (${usedPercent}% Used)`;
            },
            function(error) {
                document.getElementById('memory-total').textContent = "Memory Error";
                document.getElementById('memory-available').textContent = "";
            }
        );

        // --- 3. Get Network Status & IP ---
        tizen.systeminfo.getPropertyValue('NETWORK', 
            function(network) {
                const statusElement = document.getElementById('network-status');
                const ipElement = document.getElementById('ip-address');

                statusElement.textContent = `Type: ${network.networkType || 'N/A'}`;

                if (network.ipAddress) {
                    ipElement.textContent = `IP: ${network.ipAddress}`;
                } else if (network.networkType === 'WIFI' || network.networkType === 'ETHERNET') {
                    // Try to get more detailed info for Ethernet/WiFi
                    tizen.systeminfo.getPropertyValue(`${network.networkType}_NETWORK`, 
                        function(detail) {
                            ipElement.textContent = `IP: ${detail.ipAddress || 'Unknown'}`;
                        }, 
                        function() {
                            ipElement.textContent = 'IP: API Error';
                        }
                    );
                } else {
                    ipElement.textContent = 'Not Connected';
                }
            },
            function(error) {
                document.getElementById('network-status').textContent = "Network Error";
                document.getElementById('ip-address').textContent = error.message;
            }
        );

        // --- 4. Get Storage ---
        tizen.systeminfo.getPropertyValue('STORAGE', 
            function(storage) {
                const internalStorage = storage.units.find(unit => unit.type === 'INTERNAL');
                if (internalStorage) {
                    const totalGB = (internalStorage.capacity / 1024).toFixed(0);
                    const availableGB = (internalStorage.availableCapacity / 1024).toFixed(1);
                    const usedCapacity = internalStorage.capacity - internalStorage.availableCapacity;
                    const usagePercent = Math.round((usedCapacity / internalStorage.capacity) * 100);

                    document.getElementById('storage-available').textContent = `${availableGB} GB Free (${usagePercent}% Used)`;
                    document.getElementById('storage-fill').style.width = usagePercent + "%";
                } else {
                    document.getElementById('storage-available').textContent = "Internal Storage Not Found";
                }
            },
            function(error) {
                document.getElementById('storage-available').textContent = "Storage Error";
                document.getElementById('storage-fill').style.width = "0%";
            }
        );
    }
};
