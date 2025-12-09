package dbmethods

import (
	"log" //Lets you log errors for debugging

	"gorm.io/driver/postgres" //Lets you connect to postgres
	"gorm.io/gorm"            //Lets you user gorm functionality
	"gorm.io/gorm/schema"
)

var DB *gorm.DB

func DbInit() {
	//All of the database information is stringified
	dsn := "host=localhost user=postgres password=student dbname=postgres port=5432 sslmode=disable"
	//Open a connection to the database (postgres)
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: false, // Disable simple protocol to enable prepared statements with proper quoting
	}), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "",
			SingularTable: false,
			NameReplacer:  nil,
			NoLowerCase:   true,
		},
	})

	//Check if it worked
	if err != nil {
		log.Fatal("Error initializing database connection:", err)
	}

	//Optional: Update the postgres tables to reflect the models folder
	db.AutoMigrate()

	//Set the global var DB equal to the database connection
	DB = db
}
