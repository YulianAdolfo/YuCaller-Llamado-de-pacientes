package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
)

type dataPatient struct {
	DocumentType      string
	Document          string
	PatientName       string
	AppointmentState  string
	DoctorName        string
	MedicalSpeciality string
	Date              string
	Time              string
	SexPatient        string
}
type appointmentFields struct {
	CitTipDoc, CitCed, MPNOMC, CitEsta, CitCodMed, MMNomM, MENomE, CitFec, CitHorI, MPSexo string
}

func getListOfPatients(usernameDoctor string) (string, error) {
	// connecting to sql server
	connectionSql := sqlServerGetConnection()
	// verifying the connection to sql server
	contentConn := context.Background()
	if err := connectionSql.PingContext(contentConn); err != nil {
		return "", err
	}
	// if the connection is alive so create the sql qery
	querySql := fmt.Sprintf("select RTRIM(CitTipDoc), RTRIM(CitCed), RTRIM(MPNOMC), RTRIM(CitEsta), RTRIM(MMNomM), RTRIM(MENomE), RTRIM(CitFec), RTRIM(CitHorI), RTRIM(MPSexo)\n"+
		"from CITMED1 CITMED1\n"+
		"inner join CITMED CITMED\n"+
		"ON CITMED1.CitNum= CITMED.CitNum \n"+
		"LEFT JOIN CAPBAS CAPBAS\n"+
		"ON CITMED1.CitCed= CAPBAS.MPCedu AND CITMED1.CitTipDoc = CAPBAS.MPTDoc\n"+
		"LEFT JOIN MAEESP MAEESP\n"+
		"ON CITMED.CitEspMed= MAEESP.MECodE\n"+
		"INNER JOIN MAEMED1 MAEMED1\n"+
		"ON CITMED.CitCodMed= MAEMED1.MMCODM\n"+
		"WHERE CitFec = CAST(GETDATE() AS DATE) AND CitEsta IN ('F','C') AND MMUsuario = '%s'", usernameDoctor)
	//CAST(GETDATE() AS DATE)

	rows, err := connectionSql.QueryContext(contentConn, querySql)
	if err != nil {
		return "", err
	}
	defer rows.Close()
	var patients []interface{}
	for rows.Next() {
		var dataAppointmentPatient dataPatient
		var readField appointmentFields
		err = rows.Scan(&readField.CitTipDoc, &readField.CitCed, &readField.MPNOMC, &readField.CitEsta, &readField.MMNomM, &readField.MENomE, &readField.CitFec, &readField.CitHorI, &readField.MPSexo)
		if err != nil {
			return "", err
		}
		dataAppointmentPatient.DocumentType = readField.CitTipDoc
		dataAppointmentPatient.Document = readField.CitCed
		dataAppointmentPatient.PatientName = readField.MPNOMC
		dataAppointmentPatient.AppointmentState = readField.CitEsta
		dataAppointmentPatient.DoctorName = readField.MMNomM
		dataAppointmentPatient.MedicalSpeciality = readField.MENomE
		dataAppointmentPatient.Date = readField.CitFec
		dataAppointmentPatient.Time = readField.CitHorI
		dataAppointmentPatient.SexPatient = readField.MPSexo
		patients = append(patients, dataAppointmentPatient)
	}
	patientsInJson, err := json.Marshal(patients)
	if err != nil {
		return "", err
	}
	defer connectionSql.Close()
	fmt.Println("Se ha procesado una petición para el usuario: " + usernameDoctor)
	return string(patientsInJson), nil
}
func requestPatient(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	doctorName := r.URL.Query().Get("doctor-name-id")
	if doctorName != "" && len(doctorName) >= 7 {
		doctorName = decryptName(doctorName)
		queryState, err := getListOfPatients(doctorName)
		if err != nil {
			fmt.Println("Error: " + err.Error())
		}
		fmt.Fprint(w, queryState)
	}
}
func decryptName(username string) string {
	username = strings.ToUpper(username)
	var encryptionSentence string
	for i := 0; i < len(username); i++ {
		switch string(username[i]) {
		case "A":
			encryptionSentence += "Z"
		case "B":
			encryptionSentence += "Q"
		case "C":
			encryptionSentence += "7"
		case "D":
			encryptionSentence += "G"
		case "E":
			encryptionSentence += "Y"
		case "F":
			encryptionSentence += "5"
		case "G":
			encryptionSentence += "M"
		case "H":
			encryptionSentence += "0"
		case "I":
			encryptionSentence += "C"
		case "J":
			encryptionSentence += "F"
		case "L":
			encryptionSentence += "X"
		case "M":
			encryptionSentence += "8"
		case "N":
			encryptionSentence += "I"
		case "O":
			encryptionSentence += "4"
		case "P":
			encryptionSentence += "U"
		case "Q":
			encryptionSentence += "L"
		case "R":
			encryptionSentence += "A"
		case "S":
			encryptionSentence += "6"
		case "T":
			encryptionSentence += "E"
		case "U":
			encryptionSentence += "3"
		case "V":
			encryptionSentence += "¡"
		case "W":
			encryptionSentence += "9"
		case "X":
			encryptionSentence += "V"
		case "Y":
			encryptionSentence += "O"
		default:
			encryptionSentence += "2"
		}
	}
	return encryptionSentence
}
func main() {
	http.HandleFunc("/patients-in-appointment", requestPatient)
	log.Println("----------------------------------------------")
	log.Println("Attention: The server is running on port: 8600")
	log.Println("---------------------------------------------")
	log.Fatal(http.ListenAndServeTLS(":8600", "./ssl/certi.crt", "./ssl/ssl-server-k.key", nil))
}
