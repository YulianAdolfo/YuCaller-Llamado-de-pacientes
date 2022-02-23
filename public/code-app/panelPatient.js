var speakerFirst = document.getElementById("speaker-one")
var speakerSecond = document.getElementById("speaker-two")
var elementSpk = document.getElementById("elem-speaker")
var panelInformation = document.getElementById("panel-patient")
var panelInformationRight = document.getElementById("card-list-patients")
var panelTimer = document.getElementById("waiting-panel")
var receiver_sockets = io.connect("https://172.16.1.121:4041", { forceNew: true })
var patientNameSent = undefined
var consultingRoom = undefined
var doctorName = undefined
var imageSexPatient = undefined
var audio_voice = undefined
var isPlayingVoice = false
var dataQueue = []
var dataText = []
var dataObjectVoice = {
    voice: "",
    data: ""
}

receiver_sockets.on("data-for-receivers", (data_received, dataPatient) => {
    var dataFromDoctor = JSON.parse(dataPatient)
    panelTimer.classList.add("opacity-timer")
    setTimeout(() => {
        divfirst.classList.remove("do-not-show")
        divSecond.classList.remove("do-not-show")
        divThird.classList.remove("do-not-show")
    }, 200);
    if (!isPlayingVoice) {
        dataQueue.push(data_received)
        dataText.push(dataFromDoctor)
        playingInQueue()
    } else {
        dataQueue.push(data_received)
        dataText.push(dataFromDoctor)
    }
})
receiver_sockets.on("message", (data) => {
    console.log(data)
})
receiver_sockets.on("test-connection", ()=> {
    console.log("someone tested the connection of this panel")
    receiver_sockets.emit("request-message-ping", "Se ha detectado una conexión del panel de pacientes: conexión existente detectada")
})
function elementDiv() {
    return document.createElement("div")
}
function elementSpan() {
    return document.createElement("span")
}
function elementImage() {
    return document.createElement("img")
}
function createPanelPatientName() {
    var patientName = elementDiv()
    var roundImage = elementDiv()
    var icon = elementImage()
    var labelName = elementDiv()
    var containerName = elementDiv()
    var nameInText = document.createElement("p")

    patientName.classList.add("patient-name")
    roundImage.classList.add("round-image-genre")
    labelName.classList.add("label-name")
    containerName.classList.add("container-name")

    roundImage.appendChild(icon)

    containerName.appendChild(nameInText)
    labelName.appendChild(containerName)

    patientName.appendChild(roundImage)
    patientName.appendChild(labelName)

    return [patientName, icon, nameInText]
}
function createPanelConsultingRoomName() {
    var consultingRoomName = elementDiv()
    var roundImage = elementDiv()
    var labelName = elementDiv()
    var span = elementSpan()
    var image = elementImage()

    consultingRoomName.classList.add("consulting-room-name")
    roundImage.classList.add("round-image-genre", "round-right")
    labelName.classList.add("label-name", "label-name-right", "con-rom-name")
    span.innerHTML = "Lugar:"
    image.src = "/consulting-room"
    labelName.appendChild(span)
    roundImage.appendChild(image)

    consultingRoomName.appendChild(roundImage)
    consultingRoomName.appendChild(labelName)

    return [consultingRoomName, span]
}
function createPanelDoctorName() {
    var apptDoctor = elementDiv()
    var roundImage = elementDiv()
    var labelName = elementDiv()
    var image = elementImage()
    var span = elementSpan()

    //appt-doctor appt-doctor-animation time-in-animation
    apptDoctor.classList.add("appt-doctor")
    roundImage.classList.add("round-image-genre", "round-left")
    labelName.classList.add("label-name", "label-name-left", "doctor-name")
    span.innerHTML = "Médico:"
    image.src = "/medic-icon"
    labelName.appendChild(span)
    roundImage.appendChild(image)
    apptDoctor.appendChild(roundImage)
    apptDoctor.appendChild(labelName)

    return [apptDoctor, span]
}
function buildInterface() {
    var initState = "starting app..."
    var firstDiv = createPanelPatientName()
    var secondDiv = createPanelConsultingRoomName()
    var thirdDiv = createPanelDoctorName()

    firstDiv[2].innerText = initState

    panelInformation.appendChild(firstDiv[0])
    panelInformation.appendChild(secondDiv[0])
    panelInformation.appendChild(thirdDiv[0])

    return [firstDiv[2], secondDiv[1], thirdDiv[1], firstDiv[1]]

}
function buildAlreadyCalled(name, time, sex) {
    var container = elementDiv()
    var iconGenre = elementImage()
    var spanName = elementSpan()
    var spanTime = elementSpan()

    container.classList.add("card-patient")
    iconGenre.src = sex
    spanName.textContent = name
    spanTime.textContent = time

    container.appendChild(iconGenre)
    container.appendChild(spanName)
    container.appendChild(spanTime)
    if (panelInformationRight.children.length == 1) {
        panelInformationRight.appendChild(container)
    } else {
        panelInformationRight.insertBefore(container, panelInformationRight.children[1])
    }
    setTimeout(() => {
        container.classList.add("transition-delete-card")
        setTimeout(() => {
            panelInformationRight.removeChild(container)
        }, 1000);
    }, 60000);
}
var arrayDataReturned = buildInterface()
patientNameSent = arrayDataReturned[0]
consultingRoomName = arrayDataReturned[1]
doctorName = arrayDataReturned[2]
imageSexPatient = arrayDataReturned[3]
// getting through parent elements to the main container
var divfirst = patientNameSent.parentElement.parentElement.parentElement
var divSecond = consultingRoomName.parentElement.parentElement
var divThird = doctorName.parentElement.parentElement
divfirst.classList.add("do-not-show", "patient-name-animation")
divSecond.classList.add("do-not-show", "consulting-room-name-animation")
divThird.classList.add("do-not-show", "appt-doctor-animation")

async function playingInQueue() {
    isPlayingVoice = true
    while (dataQueue.length > 0) {
        await new Promise((res, rej) => {
            try {
                // notify when any doctor calls to any patient
                var notifyAlert = new Audio("/sound-alert")
                notifyAlert.play()
                notifyAlert.onended = () => {
                    // identify if the patient is man or woman
                    dataText[0].sexPatient == "F" ? imageSexPatient.src = "/img-woman" : imageSexPatient.src = "/img-man"
                    patientNameSent.textContent = dataText[0].patientName
                    consultingRoomName.innerHTML = "<span>Lugar:</span>" + `<span style='font-weight:normal;'>${dataText[0].consultingRoomName}</span>`
                    doctorName.innerHTML = "<span>Médico:</span>" + `<span style='font-weight:normal;'>${dataText[0].doctorName}</span>`
                    patientNameSent.classList.add("animation-for-name")
                    setTimeout(() => {
                        patientNameSent.classList.remove("animation-for-name")
                    }, 3000);
                    var playVoice = new Audio(URL.createObjectURL(new Blob(dataQueue[0])))
                    playVoice.play()
                    playVoice.onplay = () => {
                        receiver_sockets.emit("state-playing-voice", "Se está llamando al paciente en este instante ", dataText[0].actualHashEvent)
                    }
                    playVoice.onended = () => {
                        dataQueue.shift()
                        setTimeout(() => {
                            res("end-voice")
                            buildAlreadyCalled(dataText[0].patientName, dataText[0].time, imageSexPatient.src)
                            dataText.shift()
                        }, 6000);
                    }
                }
            } catch (error) {
                alert("ha ocurrido un error: " + error)
            }
        })
    }
    isPlayingVoice = false
    setTimeout(() => {
        if (!isPlayingVoice) {
            divfirst.classList.add("do-not-show")
            divSecond.classList.add("do-not-show")
            divThird.classList.add("do-not-show")
            panelTimer.classList.remove("opacity-timer")
        }
    }, 15000);
}
async function getCurrentTime() {
    var completeDateInString = document.getElementById("date")
    var getCurrentTime = new Date()
    var dateToSet = buildTime(getCurrentTime)
    completeDateInString.textContent = dateToSet[0]
    activeClock(dateToSet[1])
}
function buildTime(currentTimeApi) {
    var currentTime = currentTimeApi
    var currentDateTime = {
        date: {
            dayMonth: currentTime.getDate(),
            dayWeek: currentTime.getDay(),
            month: currentTime.getMonth(),
            year: currentTime.getFullYear()
        },
        time: {
            hours: currentTime.getHours(),
            minutes: currentTime.getMinutes(),
            seconds: currentTime.getSeconds()
        }
    }
    var arrayDayWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    var arrayDayMonth = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    var dateString = arrayDayWeek[currentDateTime.date.dayWeek] + " " + currentDateTime.date.dayMonth + " de " + arrayDayMonth[currentDateTime.date.month] + " de " + currentDateTime.date.year
    return [dateString, currentDateTime.time]
}
var controllerTimerUpdate = 0
function activeClock(time) {
    var hourInPanel = document.getElementById("hour-span")
    var minuteInPanel = document.getElementById("minute-span")
    var stateDay = document.getElementById("state-pm-am")
    var currentHour = time.hours
    var currentMinute = time.minutes
    var currentSecond = time.seconds

    function structureMinutes() {
        currentMinute < 10 ? minuteInPanel.textContent = "0" + currentMinute : minuteInPanel.textContent = currentMinute
    }
    function structureHours() {
        currentHour < 10 ? hourInPanel.textContent = "0" + currentHour : hourInPanel.textContent = currentHour
    }
    function structureDay() {
        currentHour >= 13 ? stateDay.textContent = " pm" : stateDay.textContent = " am"
    }
    structureMinutes()
    structureHours()
    structureDay()
    controllerTimerUpdate = setInterval(() => {
        currentSecond++
        if (currentSecond > 59) {
            currentSecond = 0
            currentMinute++
            structureMinutes()
            if (currentMinute > 59) {
                currentMinute = 0
                currentHour++
                structureMinutes()
                structureHours()
                structureDay()
            }
        }
    }, 1000);
}

getCurrentTime()

function backgroundRequestFullScreenAndInteract() {
    var window = document.createElement("div")
    window.style.width = "100%"
    window.style.height = "100%"
    window.style.backgroundColor = "rgba(0,0,0,.8)"
    window.style.position = "absolute"
    window.style.zIndex = "100"
    window.style.left = "0"
    window.style.top = "0"
    window.style.display = "flex"
    window.style.justifyContent = "center"
    window.style.alignItems = "center"
    document.body.appendChild(window)
    //-----------------------------
    var panel = document.createElement("div")
    panel.style.width = "300px"
    panel.style.height = "100px"
    panel.style.borderRadius = "10px"
    panel.style.backgroundColor = "#00adef"
    panel.innerText = "Da un click para activar la pantalla completa"
    panel.style.color = "white"
    panel.style.fontWeight = "bold"
    panel.style.display = "flex"
    panel.style.justifyContent = "center"
    panel.style.textAlign = "center"
    panel.style.alignItems = "center"
    panel.style.cursor = "pointer"
    window.appendChild(panel)

    window.onclick = () => {
        document.documentElement.requestFullscreen()
        panel.innerText = "!!!....Gracias....!!!"
        panel.style.textAlign = "center"
        setTimeout(() => {
            document.body.removeChild(window)
        }, 1000);
    }

} 
// this line updates the time in the clock only if the user has clicked on twice
document.ondblclick = () => {
    clearInterval(controllerTimerUpdate)
    getCurrentTime()
    document.documentElement.requestFullscreen()
}
backgroundRequestFullScreenAndInteract()