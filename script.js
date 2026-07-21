let codeReader = null;

async function startCamera() {

    const reader = document.getElementById("reader");

    reader.innerHTML = "";

    codeReader = new ZXing.BrowserMultiFormatReader();

    try {

        const devices = await ZXing.BrowserCodeReader.listVideoInputDevices();

        if (devices.length === 0) {
            alert("هیچ دوربینی پیدا نشد");
            return;
        }

        let cameraId = devices[0].deviceId;

        devices.forEach(device => {

            const name = (device.label || "").toLowerCase();

            if (
                name.includes("back") ||
                name.includes("rear") ||
                name.includes("environment")
            ) {
                cameraId = device.deviceId;
            }

        });

        codeReader.decodeFromVideoDevice(
            cameraId,
            "reader",
            (result) => {

                if(result){
                    document.getElementById("barcode").value = result.text;
                }

            }
        );

    } catch(e){

        alert(e);

    }

}

window.onload = function(){

    document.getElementById("startBtn").addEventListener("click",function(){

        alert("دکمه کار میکند");

        document.getElementById("loginPage").style.display="none";

        document.getElementById("scanPage").style.display="block";

        document.getElementById("userLabel").innerText =
            document.getElementById("user").value;

        document.getElementById("branchLabel").innerText =
            document.getElementById("branch").value;

        startCamera();

    });

};
