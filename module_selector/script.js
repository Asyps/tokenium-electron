// Helper function
// Generated using ChatGPT
function toDisplayName(programmingName) {
    

    // Replace hyphens or underscores with spaces
    let displayName = programmingName.replace(/[-_]/g, ' ');
    
    // Capitalize the first letter
    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    
    return displayName;
}

// Module info class
class moduleInfo {
    constructor(name, extensions) {
        this.name = name;
        this.extensions = extensions;
    }
}

async function generateOptions() {
    var moduleList = await window.getModuleList();
    var selectedModules = await window.getSelectedModules(window.gameName);
    var checkboxList = document.getElementById("checkbox-list");


    // Generating the checklist
    for (i of moduleList) {
        // Module option div
        moduleOptionDiv = document.createElement("div");
        moduleOptionDiv.setAttribute("class", "main-option-group");

        // Checkbox
        moduleOptionCheckbox = document.createElement("input");
        moduleOptionCheckbox.type = "checkbox";
        moduleOptionCheckbox.setAttribute("class", "main-option");
        moduleOptionCheckbox.id = i.name;

        moduleOptionDiv.appendChild(moduleOptionCheckbox);
        moduleOptionCheckbox.insertAdjacentText('afterend', toDisplayName(i.name));

        // Check if the module has extensions
        if (i.extensions.length > 0) {
            // Div for extensions
            extensionOptionDiv = document.createElement("div");
            extensionOptionDiv.setAttribute("class", "sub-options-group");

            // Checkboxes for extensions
            for (j of i.extensions) {
                extensionOptionCheckbox = document.createElement("input");
                extensionOptionCheckbox.type = "checkbox";
                extensionOptionCheckbox.setAttribute("class", "sub-option");
                extensionOptionCheckbox.disabled = true;
                extensionOptionCheckbox.id = i.name + ":" + j;

                extensionOptionDiv.appendChild(extensionOptionCheckbox);
                extensionOptionCheckbox.insertAdjacentText('afterend', toDisplayName(j));
                extensionOptionDiv.appendChild(document.createElement("br"));
            }

            moduleOptionDiv.appendChild(extensionOptionDiv);

            // Disable suboptions if main option is unchecked
            // Generated by ChatGPT
            moduleOptionCheckbox.addEventListener('change', function() {
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

        checkboxList.appendChild(moduleOptionDiv);
    }

    // applying current selected modules
    for (i of selectedModules) {
        console.log(i);

        m = document.getElementById(i.name)
        m.checked = true;
        m.dispatchEvent(new Event('change'));
        
        for (j of i.extensions) {
            document.getElementById(i.name + ":" + j).checked = true;
        }
    }
}

generateOptions();


// Confirm button
function confirmSelection() {
    // Extracting selected modules
    // Generated by ChatGPT, edited
    let modules = [];

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

            // Create new moduleInfo object and push it to the modules array
            modules.push(new moduleInfo(moduleName, extensions));
        }
    });

    // Apply the result
    window.setSelectedModules(window.gameName, modules);

    // Close self
    window.close();
}
