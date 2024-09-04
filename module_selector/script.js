async function generateOptions() {
    var moduleList = await window.moduleList();
    var selectedModules = await window.getSelectedModules(document.getElementById("select game").value);

    console.log(moduleList)
    console.log(selectedModules)
}

generateOptions();

function confirmSelection() {

}