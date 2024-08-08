window.onmessage = (e) => {
    window.port = e.ports[0]

    const output = document.getElementById("out");

    window.port.onmessage = (e) => {
        output.innerHTML = e.data;
    }
}

// button
function action() {
    window.port.postMessage("Úspěšně proběhl zprávsending");
}