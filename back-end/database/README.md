Παρακάτω δίνεται ένα command ώστε να τρέξετε έναν postgresql container όπου θα φορτωθεί η βάση. Για την επιτυχία της εντολής, θα πρέπει να έχετε κατεβάσει το docker.

```
docker run --name ev-db -e POSTGRES_PASSWORD=123 -e POSTGRES_DB=ev_charging -p 5432:5432 -d postgres
```

Στη συνέχεια, πρέπει να τρέξετε την παρακάτω εντολή ώστε να δημιουργηθεί το schema στη βάση σας

```
go run back-end/api/main.go
```
