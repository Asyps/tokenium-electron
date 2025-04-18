// Helper function
// Generated using ChatGPT
function toDisplayName(programmingName) {
    // Replace hyphens or underscores with spaces
    let displayName = programmingName.replace(/[-_]/g, ' ');
    
    // Capitalize the first letter
    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    
    return displayName;
}


// Dynamically generate list of checkbox options
async function generateOptions() {
    // Obtain data
    let availableModules = await window.getAvailableModules();
    let requiredModules = await window.getRequiredModules();
    let selectedModules = await window.getSelectedModules();
    let checkboxList = document.getElementById("checkbox-list");

    // Generating the checklist
    for (let moduleName in availableModules) {
        // Is the module required? Is it selected?
        let isRequired = requiredModules.hasOwnProperty(moduleName);
        let isSelected = selectedModules.hasOwnProperty(moduleName);   // By default

        // Module option div
        let moduleDiv = document.createElement("div");
        moduleDiv.setAttribute("class", "main-option-group");

        // Checkbox
        let moduleCheckbox = document.createElement("input");
        moduleCheckbox.type = "checkbox";
        moduleCheckbox.setAttribute("class", "main-option");
        moduleCheckbox.id = moduleName;
        
        // If the module is required, disable the option to change it. It is checked in this case.
        moduleCheckbox.disabled = isRequired;  
        moduleCheckbox.checked = isRequired || isSelected;

        // Assemble them and add display text
        moduleDiv.appendChild(moduleCheckbox);
        moduleCheckbox.insertAdjacentText('afterend', toDisplayName(moduleName));

        // Check if the module has extensions
        if (availableModules[moduleName].length > 0) {
            // Div for extensions
            let extensionDiv = document.createElement("div");
            extensionDiv.setAttribute("class", "sub-options-group");

            // Checkboxes for extensions
            for (let extensionName of availableModules[moduleName]) {
                // If the module is required, check the list. Otherwise the extension cannot be required.
                let isExtensionRequired = (isRequired) ? requiredModules[moduleName].includes(extensionName) : false;
                // If the module is selected, check the list. Otherwise the extension is selected only as a result of requirement.
                let isExtensionSelected = (isSelected) ? selectedModules[moduleName].includes(extensionName) : false;


                // Create the checkbox
                let extensionCheckbox = document.createElement("input");
                extensionCheckbox.type = "checkbox";
                extensionCheckbox.setAttribute("class", "sub-option");
                extensionCheckbox.id = moduleName + ":" + extensionName;
                
                // If the extension is required, disable the option to change it. It is checked in this case.
                extensionCheckbox.disabled = isExtensionRequired || (!isSelected && !isRequired);  
                extensionCheckbox.checked = isExtensionRequired || isExtensionSelected;

                extensionDiv.appendChild(extensionCheckbox);
                extensionCheckbox.insertAdjacentText('afterend', toDisplayName(extensionName));

                // Add a <br> tag
                extensionDiv.appendChild(document.createElement("br"));
            }

            // Add the extentions to the module div
            moduleDiv.appendChild(extensionDiv);

            // Event for disabling suboptions if main option is unchecked
            // Generated by ChatGPT
            moduleCheckbox.addEventListener('change', function() {
                let subOptions = this.closest('.main-option-group').querySelectorAll('.sub-option');
                if (this.checked) {
                    subOptions.forEach(subOption => {
                        subOption.disabled = false; // Enable sub-options
                    });
                } else {
                    subOptions.forEach(subOption => {
                        subOption.checked = false;  // Uncheck sub-options
                        subOption.disabled = true;  // Disable sub-options
                    });
                }
            });
        }

        checkboxList.appendChild(moduleDiv);
    }
}

generateOptions();


// Confirm button
// Generated by ChatGPT, edited
function confirmSelection() {
    // A dict to collect the data
    let moduleData = {};

    // Iterate over all main options
    document.querySelectorAll('.main-option').forEach(mainOption => {
        if (mainOption.checked) {
            let moduleName = mainOption.getAttribute('id');
            let subOptions = mainOption.closest('.main-option-group').querySelectorAll('.sub-option');
            let extensions = [];

            // Collect checked sub-options (extensions)
            subOptions.forEach(subOption => {
                if (subOption.checked) {
                    extensionName = subOption.getAttribute('id').split(':')[1];
                    extensions.push(extensionName);
                }
            });

            // Add the module to moduleData along with it's extentions
            moduleData[moduleName] = extensions;
        }
    });

    // Apply the result
    window.returnModuleList(moduleData);

    // Close self
    window.close();
}
