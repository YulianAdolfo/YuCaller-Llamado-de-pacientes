var point_connect_state = document.getElementById("point-state")
var button_cancel = document.getElementById("button-cancel")
var buttonFormApp = document.getElementById("button-login")
var boxForm = document.getElementById("form-app")
var bonus = document.getElementById("bonus")
var mainContainer = null
var containerList = null
var containerTablePatient = null
var statusElement = null
var elementHeader = null
var send_voice_now = undefined
var caseMessage = null
var temporalHashEvent = null
var globalDataArray = []
var array_data_voice = []
var recording_voice = 0
var control_timer = 0

var dataObjectPatient = {
    patientName: "",
    doctorName: "",
    consultingRoomName: "",
    sexPatient: "",
    time: 0,
    actualHashEvent: ""
}

button_cancel.addEventListener("click", () => {
    send_voice_now = false
    stopRecording()
    setStopRecordingMessages()
})
var socket_caller = io.connect("https://172.16.1.121:4041", { forceNew: true })

socket_caller.on("message-connection", (data) => {
    if (data == "success-connection") {
        point_connect_state.style.backgroundColor = "#0055ff"
        point_connect_state.children[0].classList.add("fa-check")
        point_connect_state.children[0].style.color = "white"
    }
})
socket_caller.on("state-playing-voice", (messagePlayingVoice, hash)=> {
/*     console.log("hash medico: ", temporalHashEvent)
    console.log("hash enviado: ", hash) */
    if(temporalHashEvent == hash) {
        new Notification("llamado de pacientes", {body:messagePlayingVoice})
    }
})
socket_caller.on("request-from-panel-patient", (requestConnection)=> {
    console.log("-------------------------********* Se recibió una respuesta *********-------------------------")
    console.log(requestConnection)
})
// get access to microphone
navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(getDataMicrophone).catch(()=>{
    alert("Este dispositivo no posee algún micrófono conectado o integrado\nPor favor conecte uno e intente nuevamente\nFatal error: MICRÓFONO NO DETECTADO")
    location.href = "about:blank"
})
// success access to microphone
function getDataMicrophone(stream_voice) {
    const content_audio = { MimeType: 'audio/webm' }
    recording_voice = new MediaRecorder(stream_voice, content_audio)  // API used to record the voice
    recording_voice.addEventListener('dataavailable', (voice) => {
        if (voice.data.size > 0) {
            array_data_voice.push(voice.data) // data from microphone in Blob data    
        }
    })
    recording_voice.addEventListener('stop', () => {
        if (send_voice_now) {
            sendVoice(array_data_voice)
        } else {
            array_data_voice = []
        }
    })
}
function stopRecording() {
    recording_voice.stop()
}
function startRecording() {
    if (recording_voice.state == "paused") {
        recording_voice.resume()
    } else {
        try {
            recording_voice.start(500)
        } catch (error) {
            window.onbeforeunload = () => {}
            alert("Ha ocurrido un error probablemente con el micrófono de su computadora\n El aplicativo lo llevará al login después este mensaje.")
            location.reload()
        }
    }
    console.log(recording_voice.state)
}
function setActiveRecordingMessages() {
    controlTimeMicrophone()
}
function setStopRecordingMessages() {
    clearInterval(control_timer)
    elementHeader[1].innerHTML = "Tiempo disp. 07 seg."
}
function sendVoice(data_voice_blob) {
    if(data_voice_blob.length){
        socket_caller.emit("data-for-receivers", data_voice_blob, JSON.stringify(dataObjectPatient))
        array_data_voice = []
        clearDataContentPatient()
    }
}
//---------------------------------------------------------------------------------
function setHeaderApp(actualDoctor) {
    var consultingRoomName = localStorage.getItem("consulting-name")
    var header = document.createElement("header")
    var image = getPanel()
    var stateMicrophone = getPanel()
    var doctorName = document.createElement("p")
    var consultingRoom = document.createElement("p")
    var refreshButton = document.createElement("i")
    var signOutButton = document.createElement("i")
    var timeInMicrophone = document.createElement("p")
    var stateMic = document.createElement("p")
    var mic = document.createElement("p")
    header.classList.add("header-app")
    image.classList.add("image-app")
    stateMicrophone.classList.add("box-state-mic")
    consultingRoom.classList.add("consulting-room")
    refreshButton.classList.add("fas", "fa-redo-alt", "refresh-button")
    signOutButton.classList.add("fas", "fa-sign-out-alt", "sign-out-button")
    consultingRoom.id = "label-txt-consulting-room"

    refreshButton.title = "Refrescar resultados"
    signOutButton.title = "Salir"

    timeInMicrophone.innerHTML = "Tiempo disp. 07seg"
    mic.innerHTML = "Inactivo"
    stateMic.innerHTML = "Estado del micróphono: "

    doctorName.innerHTML = fixName(actualDoctor)
    stateMicrophone.appendChild(timeInMicrophone)
    stateMicrophone.appendChild(mic)
    stateMicrophone.appendChild(stateMic)
    consultingRoomName == null ? consultingRoom.innerHTML = "Unknown Consulting Room" : consultingRoom.innerHTML = consultingRoomName
    header.appendChild(image)
    header.appendChild(doctorName)
    header.appendChild(stateMicrophone)
    header.appendChild(consultingRoom)
    header.append(signOutButton)
    header.appendChild(refreshButton)
    header.appendChild(stateMicrophone)
    document.body.appendChild(header)

    consultingRoom.ondblclick = () => {
        setNameToConsultingRoom()
    }
    refreshButton.onclick = async () => {
        while (containerTablePatient.children.length > 1) {
            containerTablePatient.removeChild(containerTablePatient.lastElementChild)
        }
        var content = await requestDataContent(sessionStorage.getItem("current-user"))
        if (content != null) {
            insertContentToTable(content)
        }
    }
    signOutButton.onclick = () => {
        document.body.removeChild(mainContainer)
        document.body.removeChild(elementHeader[2])
        boxForm.style.display = "block"
        document.body.style.backgroundImage = "url('/images-1/logo-blue.png')"
        window.onbeforeunload = () => { }
        bonus.style.display = "block"
    }
    return [mic, timeInMicrophone, header]
}
function setNameToConsultingRoom() {
    var consultRName = prompt("Por favor, especifique el nombre actual de este consultorio")
    if (consultRName != null && consultRName.length > 5 && consultRName.length <= 13) {
        localStorage.setItem("consulting-name", consultRName)
        var consultingRoom = document.getElementById("label-txt-consulting-room")
        consultingRoom.innerHTML = consultRName
    }
}
function getPanel() {
    return document.createElement("div")
}
function dashboardDoctor() {
    var dashboard = getPanel()
    dashboard.classList.add("dashboard")
    document.body.appendChild(dashboard)
    return dashboard
}
function createInformationTable() {
    var table = document.createElement("table")
    var thName = document.createElement("th")
    var thSpecialty = document.createElement("th")
    var thStateAppt = document.createElement("th")
    var thDate = document.createElement("th")
    var thTime = document.createElement("th")
    var thCall = document.createElement("th")
    var tr = document.createElement("tr")

    thName.innerHTML = "Paciente"
    thSpecialty.innerHTML = "Especialidad"
    thStateAppt.innerHTML = "Estado de cita"
    thDate.innerHTML = "Fecha"
    thTime.innerHTML = "Hora"
    thCall.innerHTML = "Llamar"

    tr.appendChild(thName)
    tr.appendChild(thSpecialty)
    tr.appendChild(thStateAppt)
    tr.appendChild(thDate)
    tr.appendChild(thTime)
    tr.appendChild(thCall)

    table.appendChild(tr)
    table.classList.add("table-patients")

    return table
}
function containerListPatients(parent) {
    var containerList = getPanel()
    var calledPatientsYet = getPanel()
    containerList.classList.add("container-list")
    calledPatientsYet.classList.add("container-list-called")
    parent.appendChild(containerList)
    parent.appendChild(calledPatientsYet)
    return [containerList, calledPatientsYet]
}
function appendTable(containerList) {
    var table = createInformationTable()
    containerList.appendChild(table)
    return table
}
var currentMicrophoneActive = null
function insertContentToTable(dataDoctor) {
    bonus.style.display = "none"
    localStorage.setItem("current-mic", null)
    globalDataArray = dataDoctor
    for (var i = 0; i < dataDoctor.length; i++) {
        var tr = document.createElement("tr")
        var data = dataDoctor[i]
        for (var j = 0; j < 6; j++) {
            var td = document.createElement("td")
            switch (j) {
                case 0:
                    td.innerHTML = fixName(data.PatientName)
                    break;
                case 1:
                    td.innerHTML = fixName(data.MedicalSpeciality)
                    break;
                case 2:
                    td.innerHTML = data.AppointmentState
                    break;
                case 3:
                    td.innerHTML = data.Date
                    break;
                case 4:
                    td.innerHTML = data.Time
                    break;
                case 5:
                    //td.classList.add("position-tr")
                    var iconMic = document.createElement("i")
                    iconMic.classList.add("fa", "fa-microphone-slash")
                    iconMic.classList.add("microphone-app")
                    iconMic.onclick = (e) => {
                        if (localStorage.getItem("consulting-name") != null && localStorage.getItem("consulting-name") != "") {
                            var index = Array.from(containerTablePatient.children).indexOf(e.target.parentElement.parentElement)
                            if (localStorage.getItem("current-mic") == "null") {
                                localStorage.setItem("current-mic", index)
                            }
                            // start recording voice 
                            if (recording_voice.state == "inactive") {
                                startRecording()
                                setActiveRecordingMessages()
                            } else {
                                if (index == localStorage.getItem("current-mic")) {
                                    setDataContentPatient(dataDoctor[index - 1])
                                    send_voice_now = true
                                    currMic = null
                                    stopRecording()
                                    setStopRecordingMessages()
                                    localStorage.setItem("current-mic", null)
                                } else {
                                    return
                                }
                            }
                            currentMicrophoneActive = e.target
                            paintStateOfMicrophone(e.target)
                        }else {
                            alert("*** IMPOSIBLE LA COMUNICACIÓN SIN HABER ASIGNADO UN NOMBRE DE CONSULTORIO***")
                            setNameToConsultingRoom()
                        }
                    }
                    td.appendChild(iconMic)
                    break;
            }
            tr.appendChild(td)
            containerTablePatient.appendChild(tr)
        }
    }
    window.onbeforeunload = function (e) {
        return "Espera"
    }
}
function paintStateOfMicrophone(button) {
    if (button.style.backgroundColor == "rgb(30, 219, 5)") {
        var color = "orange"
        button.style.backgroundColor = color
        button.style.padding = "7px"
        elementHeader[0].style.backgroundColor = color
        elementHeader[0].innerHTML = "Inactivo"
        button.classList.replace("fa-microphone", "fa-microphone-slash")
    } else {
        var color = "rgb(30, 219, 5)"
        button.style.backgroundColor = color
        button.style.paddingLeft = "11px"
        button.style.paddingRight = "11px"
        elementHeader[0].style.backgroundColor = color
        elementHeader[0].innerHTML = "Activo"
        button.classList.replace("fa-microphone-slash", "fa-microphone")
    }
}
function setDataContentPatient(data) {
    temporalHashEvent = getGeneratedHash()
    dataObjectPatient.patientName = fixName(data.PatientName)
    dataObjectPatient.doctorName = fixName(data.DoctorName)
    dataObjectPatient.consultingRoomName = fixName(localStorage.getItem("consulting-name"))
    dataObjectPatient.sexPatient = data.SexPatient
    dataObjectPatient.time = data.Time
    dataObjectPatient.actualHashEvent = temporalHashEvent
}
function clearDataContentPatient() {
    dataObjectPatient.patientName = ""
    dataObjectPatient.consultingRoomName = ""
    dataObjectPatient.doctorName = ""
}
function alreadyCalled(calledPatient) {
    var called = document.createElement("i")
    called.classList.add("fas", "fa-caret-left", "button-left")
    called.title = "Abrir panel de pacientes llamados"
    calledPatient.appendChild(called)
}
function controlTimeMicrophone() {
    var time = 7
    control_timer = setInterval(() => {
        if (time == 0) {
            clearInterval(control_timer)
            var index = parseInt(localStorage.getItem("current-mic")) - 1
            setDataContentPatient(globalDataArray[index])
            send_voice_now = true
            stopRecording()
            setStopRecordingMessages()
            paintStateOfMicrophone(currentMicrophoneActive)
            localStorage.setItem("current-mic", null)
        }
        elementHeader[1].innerHTML = "Tiempo disp. 0" + time + " seg."
        if (time == 0) {
            setTimeout(() => {
                elementHeader[1].innerHTML = "Tiempo disp. 07 seg."
            }, 50);
        }
        time--
    }, 1000);
}
async function requestDataContent(userInRequest) {
    onprogressFunction(panel_window())
    var stateRequest = await new Promise((res, rej) => {
        fetch("https://172.16.1.121:8600/patients-in-appointment?doctor-name-id=" + userInRequest, {
            method: "GET"
        })
            .then(data => data.json())
            .then(data => res(data))
            .catch(err => rej(err))
    })
    document.body.removeChild(document.body.lastElementChild)
    return stateRequest
}

buttonFormApp.onclick = async (e) => {
    e.preventDefault()
    var user = document.getElementById("txt-user-hvt").value
    if (user.length >= 7) {
        user = user.toUpperCase()
        sessionStorage.setItem("current-user", user)
        var stateRequest = await requestDataContent(sessionStorage.getItem("current-user"))
        if (stateRequest != null) {
            var doctor = stateRequest[0].DoctorName
            boxForm.style.display = "none"
            document.body.style.backgroundImage = "none"
            elementHeader = setHeaderApp(doctor)
            mainContainer = dashboardDoctor()
            containerList = containerListPatients(mainContainer)
            containerTablePatient = appendTable(containerList[0])
            statusElement = insertContentToTable(stateRequest)
            alreadyCalled(containerList[1])
            if (sessionStorage.getItem("current-user") == "" || sessionStorage.getItem("current-user") == null) {
                sessionStorage.setItem("current-user", user)
            }
        }
    }
    document.getElementById("txt-user-hvt").value = ""
}
function panel_window() {
    panel = document.createElement("div")
    panel.classList.add("panel-window")
    document.body.appendChild(panel)
    return panel
}
function onprogressFunction(onprogressWin) {
    onprogressWin.style.backgroundColor = "rgba(0, 0,0 , .8)"
    onprogressWin.style.position = "absolute"
    onprogressWin.style.width = "100%"
    onprogressWin.style.height = "100%"
    onprogressWin.style.top = "0"
    onprogressWin.style.left = "0"
    var progressPanel = document.createElement("div")
    var progressIcon = document.createElement("div")
    var progressMessage = document.createElement("p")

    progressMessage.innerHTML = "Consultando..."
    progressMessage.style.width = "100%"
    progressMessage.style.textAlign = "center"
    progressMessage.style.fontSize = "20px"
    progressMessage.style.color = "white"
    progressMessage.style.margin = "0"
    progressMessage.style.marginTop = "5px"

    progressIcon.style.backgroundImage = "url('img-loading/loading.gif')"
    progressIcon.style.backgroundSize = "contain"
    progressIcon.style.width = "45px"
    progressIcon.style.height = "45px"
    progressIcon.style.display = "block"
    progressIcon.style.margin = "0 auto"
    progressIcon.style.marginTop = "10px"

    progressPanel.style.width = "300px"
    progressPanel.style.height = "100px"
    progressPanel.style.borderRadius = "10px"
    progressPanel.style.backgroundColor = "rgb(30, 219, 5)"
    progressPanel.style.position = "absolute"
    progressPanel.style.left = "50%"
    progressPanel.style.top = "50%"
    progressPanel.style.transform = "translate(-50%, -50%)"

    progressPanel.classList.add("responsive-win")
    progressPanel.appendChild(progressIcon)
    progressPanel.appendChild(progressMessage)
    onprogressWin.appendChild(progressPanel)

}
function fixName(name) {
    name = name.split(" ")
    for (var i = 0; i < name.length; i++) {
        name[i] = name[i].substring(0, 1) + name[i].toLowerCase().substring(1, name[i].length)
    }
    return name.join(" ")
}
document.body.addEventListener("keyup", (e) => {
    if (e.key == "Escape") {
        if (recording_voice.state != 'inactive') {
            send_voice_now = false
            currMic = null
            stopRecording()
            setStopRecordingMessages()
            localStorage.setItem("current-mic", null)
            paintStateOfMicrophone(currentMicrophoneActive)
            alert("¡SE HA CANCELADO EL LLAMADO EXITOSAMENTE!")
        }
    }
})
function getGeneratedHash() {
    return Math.random().toString(36).substring(2,9)
}
function TestCommunicationPanelPatient() {
    console.log("....................................................")
    socket_caller.emit("ping-connection-test")
}
Notification.requestPermission().then(()=>{
    if(Notification.permission == "denied" || Notification.permission == "default") {
        alert("Debe habilitar las notificaciones para esta app")
    }
}).catch()