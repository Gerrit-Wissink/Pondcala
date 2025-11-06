package services

import (
    "gorm.io/driver/postgres" //Lets you connect to postgres
    "gorm.io/gorm" //Lets you user gorm functionality
    "log" //Lets you log errors for debugging
)

var DB *gorm.DB

func dbInit() {
	//All of the database information is stringified
	dsn := "host=localhost user=postgres password=mysecret dbname=mydb port=5432 sslmode=disable"
	//Open a connection to the database (postgres)
	db, err := gorm.Open(postgres.Open(dsn), gorm.Config{})

	//Check if it worked
	if err != nil {
		log.Fatal("AAAAHHH BAD STUFF", err)
	}

	//Optional: Update the postgres tables to reflect the models folder
	db.AutoMigrate()

	//Set the global var DB equal to the database connection
	DB = db
}