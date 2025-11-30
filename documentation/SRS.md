# EMPower

### _Power Your Journey, **EMPower** Your Future!_

## Software Requirements Specifications (SRS)

---

## 1. Introduction

### 1.1 Purpose

Σκοπός του παρόντος εγγράφου είναι ο καθορισμός των απαιτήσεων για την ανάπτυξη μιας ολοκληρωμένης πλατφόρμας διαχείρισης δικτύου φορτιστών ηλεκτρικών οχημάτων. Το σύστημα στοχεύει στην εξυπηρέτηση των οδηγών ηλεκτρικών οχημάτων (εύρεση, φόρτιση, πληρωμή) και στην παροχή εργαλείων διαχείρισης στον πάροχο του δικτύου.

**Stakeholders:**

| Ρόλος | Περιγραφή |
|-------|-----------|
| **Πελάτες (EV Drivers)** | Τελικοί χρήστες που φορτίζουν τα οχήματά τους |
| **Πάροχος (CPO - Charge Point Operator)** | Διαχειριστής του δικτύου φορτιστών |
| **Ομάδα Ανάπτυξης** | Υπεύθυνοι για την υλοποίηση και συντήρηση του λογισμικού |

**Block Diagram**

```
@startuml
skinparam componentStyle uml2
skinparam linetype ortho

skinparam componentBackgroundColor #87CEFA
skinparam componentBorderColor #005a9c
skinparam componentBorderThickness 1.5
skinparam arrowColor #333333
skinparam noteBackgroundColor #FFFFFF
skinparam noteBorderColor #CCCCCC

' --- Actors ---
actor "User/Guest/Admin" as User

' --- Components (Imitating the Layout) ---

' 1. Database (Left Side)
component "Database" as DB {
    port "In" as P_DB_In
    port "Out" as P_DB_Out
}

' 2. Search & Filters (Top Middle)
component "Search Chargers" as Search {
    port "Filters" as P_Search_Filter
    port "Results" as P_Search_Res
}

component "Input & Filters" as Input {
    port "Criteria" as P_Input_Crit
}

' 3. Core Logic (Center)
component "Reservation\nManager" as Reserve {
    port "Book" as P_Res_Book
}

component "Session\nManager" as Session {
    port "Ctrl" as P_Sess_Ctrl
}

component "Billing\nService" as Billing

' 4. Authentication (Bottom Middle)
component "Sign In / Up" as Auth {
    port "Login" as P_Auth_Log
    port "Register" as P_Auth_Reg
}

' 5. User Page / Dashboard (Right Side)
component "User/Admin\nDashboard" as Dashboard {
    port "View" as P_Dash_View
}

component "Statistics" as Stats

' --- External Systems (To mimic the Recommendation/External parts) ---
component "External\nAPIs" as Ext {
    port "Maps" as P_Maps
    port "Bank" as P_Bank
    port "OCPP" as P_OCPP
}

' --- Connections (The Spaghetti Logic!) ---

' User Interaction
User --> P_Input_Crit : Search Query
User --> P_Auth_Log : Credentials
User --> P_Dash_View : View Profile

' Search Flow
Input -left-> Search : Apply Filters
Search -down-> DB : Query Data
DB -up-> Search : Return Data
Search -right-> Dashboard : Display Results

' Auth Flow
Auth -left-> DB : Validate User
Auth -right-> Dashboard : Grant Access

' Reservation Flow
Dashboard --> Reserve : Request Booking
Reserve --> Billing : Pre-auth
Billing --> Ext : Payment Gateway
Reserve -left-> DB : Store Reservation

' Charging Flow
Session --> Ext : OCPP Commands
Ext --> Session : Meter Values
Session --> Billing : Cost Calculation
Session -left-> DB : Log History

' Stats Flow
Stats -up-> DB : Fetch Data
Stats -right-> Dashboard : Show Charts

' --- Notes (Like the screenshot) ---
note top of Input
  Filter component contains
  input for search based on:
  - Plug Type
  - Power (kW)
  - Availability
end note

note left of DB
  Central Storage for:
  - Users
  - Chargers
  - Sessions
  - Reservations
end note

@enduml

```

### 1.2 Interfaces

#### 1.2.1 Interfaces to external systems

Το λογισμικό αλληλεπιδρά με τα εξής εξωτερικά συστήματα:

- **Identity Providers:** Για τη δημιουργία και τη σύνδεση χρήστη μέσω 3rd parties (όπως Google, META, Apple) 
- **Συστήματα Πληρωμών (Payment Gateways):** Για την προ-δέσμευση ποσών και την υλοποίηση συναλλαγών.
- **Υπηρεσία Εντοπισμού Τοποθεσίας (GPS):** Για την εύρεση της τρέχουσας τοποθεσίας του χρήστη (προαιρετικά).
- **Υπηρεσίες Χαρτών (Maps/Navigation):** (π.χ. Google Maps) Για απεικόνιση του δικτύου και την πλοήγηση προς τους φορτιστές.
- **Τρίτες Εφαρμογές (Aggregators):** Εξουσιοδοτημένες εφαρμογές που αντλούν δεδομένα κατάστασης φορτιστών.

\
**Πρότυπα & Πρωτόκολλα:**
- OCPP (Open Charge Point Protocol): Για την επικοινωνία των φορτιστών με το backend μέσω websockets. 
- HTTPS/TLS 1.3: Για ασφαλή δικτυακή επικοινωνία με το backend/ τους φορτιστές μέσω REST API (JSON/CSV).
- PCI-DSS: Πρότυπα ασφαλείας για προστασία προσωπικών δεδομένων και atomic τραπεζικές συναλλαγές (ACID).
- OAuth : Για την ασφαλή ταυτοποίηση του χρήστη κατά την είσοδό του στην εφαρμογή.

**Component Diagram**

```
@startuml
skinparam componentStyle uml2
skinparam linetype ortho
left to right direction

'--- Styling ---
skinparam backgroundColor white
skinparam component {
  BackgroundColor #E3F2FD
  BorderColor #1565C0
  ArrowColor #455A64
  FontName Arial
  FontSize 12
}
skinparam component<<subsystem>> {
  BackgroundColor #F5F5F5
  BorderColor #424242
  BorderStyle dashed
}
skinparam interface {
  BackgroundColor #1565C0
  BorderColor #1565C0
}
skinparam port {
  BackgroundColor #FFCA28
  BorderColor #FFA000
}

'--- External Actors ---
interface "User/Admin" as ExtUser
interface "External\nPayment API" as ExtPayment
interface "Charger\nHardware (OCPP)" as ExtHW
interface "3rd Party\nIdentity Provider" as ExtSSO

'--- The Main Subsystem Boundary ---
component "EV Charging System" <<subsystem>> {

    '--- Ports ---
    port "UI Port" as P_UI
    port "Bank Port" as P_Bank
    port "HW Port" as P_HW
    port "Auth Port" as P_Auth

    '--- Internal Grouping ---
    package "Presentation Layer" {
        component "Dashboard UI" as Dash <<Component>>
    }

    package "Core Business Logic" {
        component "Auth Service" as Auth <<Component>>
        component "Search Service" as Search <<Component>>
        component "Reservation\nManager" as Res <<Component>>
        component "Session\nManager" as Session <<Component>>
        component "Billing Service" as Billing <<Component>>
        component "Display Statistics" as Stats <<Component>>
    }

    package "Data Layer" {
        component "Database\nAccess" as DB <<Component>>
    }

    '--- Internal Interfaces (Wiring) ---
    
    ' 1. Auth 
    interface "Auth Interface" as IAuth
    Auth -left- IAuth
    Dash --( IAuth
    Auth --(0- P_Auth : verifies token

    ' 2. Search
    interface "Search Interface" as ISearch
    Search -left- ISearch
    Dash --( ISearch

    ' 3. Reservation
    interface "Booking Interface" as IBooking
    Res -left- IBooking
    Dash --( IBooking

    ' 4. Billing
    interface "Billing Interface" as IBilling
    Billing -up- IBilling
    Res --( IBilling
    Session --( IBilling

    ' 5. Statistics (New)
    interface "Statistics Interface" as IStats
    Stats -left- IStats
    Dash --( IStats

    ' 6. Database (Shared)
    interface "Data Interface" as IData
    DB -left- IData
    Auth --( IData
    Search --( IData
    Res --( IData
    Session --( IData
    Stats --( IData

    '--- Port Connections ---
    P_UI -right- Dash
    
    ' Connect bottom components to bottom ports
    Session --(0- P_HW
    Billing --(0- P_Bank

    '--- Layout Helpers (Hidden lines to stack logic components) ---
    Auth -[hidden]down- Search
    Search -[hidden]down- Res
    Res -[hidden]down- Session
    Session -[hidden]down- Billing
    Billing -[hidden]down- Stats
}

'--- External Connections ---
ExtUser -- P_UI

' Bottom External Systems
P_Auth -- ExtSSO
P_Bank -- ExtPayment
P_HW -- ExtHW

' Organize bottom row
ExtSSO -[hidden]left- ExtPayment
ExtPayment -[hidden]left- ExtHW

@enduml
```

#### 1.2.2 User Interfaces

Η διεπαφή χρήστη αφορά κυρίως την δικτυακή εφαρμογή για τον πελάτη που παρέχει και τη δυνατότητα προβολής στο κινητό, η οποία περιλαμβάνει τις εξής οθόνες:

- **Οθόνη Εισόδου/Εγγραφής:** Για την ασφαλή ταυτοποίηση του χρήστη. Η σύνδεση δεν είναι υποχρεωτική, καθώς ο χρήστης μπορεί να δει το δίκτυο ανώνυμα εάν το επιθυμεί, με απενεργοποιημένη τη δυνατότητα δέσμευσης και φόρτισης.

[Login Screen](https://imgur.com/aFWLYIi)

- **Χάρτης/Αναζήτηση:** Εμφάνιση σημείων φόρτισης, φίλτρα διαθεσιμότητας και επιλογή για πλοήγηση ή δέσμευση.

[Map Screen](https://imgur.com/kule4Zg)

- **Οθόνη Φορτιστή:** Εμφάνιση λεπτομερειών του επιλεγμένου φορτιστή και επιλογές δέσμευσης ή έναρξης φόρτισης.

[Charger Details Screen](https://imgur.com/lQm56B1)

- **Συνεδρία Φόρτισης (Live):** Οθόνη που εμφανίζει την πρόοδο (%, kWh, τρέχον κόστος) και κουμπί τερματισμού.

[Charging Screen](https://imgur.com/9Fuvrff)

- **Στατιστικά Χρήστη:** Οθόνη που εμφανίζει στατιστικά σχετικά με την δραστηριότητα του χρήστη (δαπάνες/κατανάλωση σε kWh ανά συγκεκριμένα χρονικά διαστήματα, μέσος χρόνος φόρτισης, πιο συχνά σημεία φόρτισης κ.α).

[User Stats](https://imgur.com/WB3qZ38)

- **Στατιστικά Διαχειριστή:** Οθόνη που παρέχει συνολική εικόνα για την απόδοση του δικτύου φορτιστών (συνολικά έσοδα, κατανάλωση σε kWh, πλήθος συνεδριών ανά χρονικό εύρος), με στοιχεία για την πληρότητα των σταθμών (utilization), τον εντοπισμό ωρών αιχμής και αναλυτικές αναφορές βλαβών ανά σταθμό ή περιοχή.

[Admin Stats](https://imgur.com/PQESCpj)


---

## 2. References

- `project_softeng2025_part1_v01_published.pdf`: Εκφώνηση εργασίας.
- `ISO/IEC/IEEE 29148:2018`: Διεθνές πρότυπο για τη συγγραφή SRS.
- `https://www.visual-paradigm.com/guide/`: Οδηγοί του Visual Paradigm για τους τύπους διαγραμμάτων UML

**Glossary:**

| Όρος | Ορισμός |
|------|---------|
| **Session** | Η διαδικασία φόρτισης από την έναρξη μέχρι τον τερματισμό |
| **CPO** | Charge Point Operator (Πάροχος) |
| **CLI** | Διεπαφή Γραμμής Εντολών (εργαλείο διαχείρισης για τον Πάροχο) |


---

## 3. Software requirements

Το σύστημα υποστηρίζει δύο βασικούς ρόλους χρηστών (**Πελάτης**, **Διαχειριστής**) και τις λειτουργίες που αντιστοιχούν σε αυτούς.

### 3.1 Use Cases

#### 3.1.1 Use case 1: Find and Navigate

Το use case περιγράφει τη διαδικασία κατά την οποία ο User εντοπίζει έναν διαθέσιμο φορτιστή σύμφωνα με τα κριτήριά του, τον επιλέγει από την απεικόνιση του χάρτη και στη συνέχεια μεταφέρεται σε εξωτερική υπηρεσία πλοήγησης (Maps & Navigation Service) με σκοπό την καθοδήγηση προς το σημείο φόρτισης.

##### 3.1.1.1 Roles involved

- **User**: Ο τελικός χρήστης που αλληλεπιδρά με την πλατφόρμα.  
- **Maps & Navigation Service**: Εξωτερική υπηρεσία απεικόνισης χαρτών και παροχής πλοήγησης.  
- **Device Location Service**: Υπηρεσία εντοπισμού θέσης της συσκευής του User (προαιρετική).

##### 3.1.1.2 Preconditions

- Ο User διαθέτει ενεργή σύνδεση στο διαδίκτυο.  
- Η Maps & Navigation Service είναι διαθέσιμη.  
- Ο browser του User υποστηρίζει διαδραστικούς χάρτες.  
- Η χρήση της τοποθεσίας της συσκευής επιτρέπεται μόνο εφόσον ο User έχει παράσχει ρητή συναίνεση.  
- Ο User δεν απαιτείται να διαθέτει λογαριασμό για την εκτέλεση του use case.
- Ο User μπορεί να είναι συνδεδεμένος στον λογαριασμό του ή να πραγματοποιεί συνεδρία επισκέπτη.

##### 3.1.1.3 Execution environment

- Web-based frontend προσβάσιμο από σύγχρονο browser.  
- Προαιρετικά: συσκευή με διαθέσιμο API εντοπισμού θέσης.

##### 3.1.1.4 Input data

- Επιλεγμένες παράμετροι αναζήτησης (φίλτρα).  
- Αναγνωριστικό του φορτιστή που επιλέγει ο User.  
- Απόφαση του User σχετικά με τη χρήση της τοποθεσίας της συσκευής.

##### 3.1.1.5 Expected behaviour

**Main Flow**
```
@startuml UC-FIND-NAV-main-activity

start

:Maps & Navigation Service\nshows the map;
:The system displays\nthe search filters;

:The system requests access\nto the user's location;
:The Customer (EV Driver) accepts\nor denies the access request;

if (Did the Customer (EV Driver)\nallow location access?) then (yes)
  :The Device Location Service\nretrieves the user's location;
  :The Maps & Navigation Service\ncenters the map on\nthe user's location;
else (no)
  :The Maps & Navigation Service\ncenters the map on\nthe default location;
endif


repeat
:The Customer (EV Driver)\nmodifies the search filters;
:The system updates accordingly\nthe chargers displayed\non the map;

repeat while (Has the Customer (EV Driver)\nfinished the search?) is (no) not (yes)


repeat
:The Customer (EV Driver)\nselects a charger;
:The system displays\nthe characteristics of the\nselected charger;

repeat while (Does the Customer (EV Driver)\nconfirm their selection?) is (no) not (yes)
  :The system stores\nthe selected charger\nin the session;
  :The Customer (EV Driver)\nchooses to start\nnavigation;
  :The Maps & Navigation Service\ncreates the navigation link;
  :The system redirects\nthe user to the\nnavigation platform;
  stop

@enduml
```

**Alternate flow 1: Υπάρχει αποθηκευμένος φορτιστής στη συνεδρία**

```
@startuml UC-FIND-NAV-alt-saved-charger

start
note left
Entry from main scenario
after the step
«Maps & Navigation Service
shows the map»
end note


:The system checks whether there is\na selected charger\nin the session;

if (Is there a selected\ncharger in the session?) then (yes)
  :The Maps & Navigation Service\ncenters the map\non the charger's location;
  :Return to the main scenario;
  note left
    «The Customer modifies
    the search filters»
  end note
else (no)
  :Return to the main scenario;
  note right
    «The system requests access
    to the user's location»
  end note
endif

stop
@enduml
```

**Alternate flow 2: Τα φίλτρα του χρήστη δεν αντιστοιχούν σε διαθέσιμο φορτιστή**

```
@startuml UC-FIND-NAV-alt-no-chargers

start

note left
Entry from main scenario
after the step
"The system appropriately updates
the chargers displayed
on the map"
end note

if (Are there available\nchargers on the map?) then (yes)
  :Return to the main scenario;
  note left
    Customer (EV Driver)
    selects a charger
  end note
else (no)
  :The system informs the user\nthat no chargers were found\nfor the current filters;
  :Return to the main scenario;
  note right
    The Customer (EV Driver)
    modifies the search filters
  end note
endif

stop
@enduml
```

##### 3.1.1.6 Output data and postconditions

**Output data**

- Ενημερωμένη απεικόνιση διαθέσιμων φορτιστών στον χάρτη.  
- Πληροφορίες επιλεγμένου φορτιστή.  
- Σύνδεσμος πλοήγησης προς τον επιλεγμένο φορτιστή.  
- Διατήρηση της επιλογής φορτιστή στην τρέχουσα συνεδρία.

**Postconditions**

- Σε επιτυχή ολοκλήρωση:
  - Έχει οριστεί ένας επιλεγμένος φορτιστής για την τρέχουσα συνεδρία.  
  - Έχει εκκινηθεί διαδικασία πλοήγησης προς τον επιλεγμένο φορτιστή μέσω της Maps & Navigation Service.  

- Σε αποτυχία ή διακοπή:
  - Δεν έχει οριστεί φορτιστής για τη συνεδρία.  
  - Δεν έχει δημιουργηθεί ή χρησιμοποιηθεί σύνδεσμος πλοήγησης.

##### 3.1.1.7 Notes

- Η διαδικασία πλοήγησης εξαρτάται από τη διαθεσιμότητα της Maps & Navigation Service.  
- Η τοποθεσία του User δεν αποθηκεύεται μόνιμα και δεν διατηρείται ιστορικό τοποθεσίας.  
- Όλες οι επιλογές φίλτρων προέρχονται από προκαθορισμένο σύνολο τιμών που παρέχει το σύστημα.

---

#### 3.1.2 Use case 2: Reserve Charger
Ο εγγεγραμμένος χρήστης κάνει κράτηση ενός φορτιστή για συγκεκριμένο χρονικό διάστημα για να διασφαλίσει τη διαθεσιμότητα κατά την άφιξή του. Η κράτηση περιλαμβάνει προεξόφληση ποσού και διασφαλίζει την αποκλειστική χρήση του φορτιστή για το επιλεγμένο χρονικό διάστημα.

##### 3.1.2.1 Roles involved
- **EV Driver (Registered)** - Κύριος χρήστης που πραγματοποιεί την κράτηση
- **Payment Gateway** - Εξωτερικό σύστημα πληρωμών για προεξόφληση
- **Backend System** - Κεντρικό σύστημα διαχείρισης φορτιστών και κρατήσεων
- **Notification Service** - Σύστημα ειδοποιήσεων για επιβεβαιώσεις και υπενθυμίσεις

##### 3.1.2.2 Preconditions
- Ο χρήστης είναι πιστοποιημένος και συνδεδεμένος στην εφαρμογή
- Ο φορτιστής βρίσκεται σε κατάσταση "Διαθέσιμος" (Available)
- Ο χρήστης έχει επαληθευμένο και έγκυρο τρόπο πληρωμής στο προφίλ του
- Η συσκευή έχει ενεργή σύνδεση στο διαδίκτυο
- Ο χρήστης έχει αποδεχτεί τους όρους χρήσης για κρατήσεις
- Ο λογαριασμός του χρήστη δεν έχει περιορισμούς ή εκκρεμή χρέη

##### 3.1.2.3 Execution environment
Web πλατφόρμα ή Mobile εφαρμογή (Android/iOS) με υποστήριξη για ειδοποιήσεις push και πληρωμές online

##### 3.1.2.4 Input data
- **Αναγνωριστικό Φορτιστή (Charger ID)**: Μοναδικός κωδικός του επιλεγμένου φορτιστή
- **Διάρκεια Κράτησης**: Ορίζεται δυναμικά από τον διαχειριστή δικτύου σε επίπεδο φορτιστή (15-60 λεπτά), βάσει των στατιστικών χρήσης και πληρότητας που παρέχει το σύστημα. Αυτή η ευελιξία επιτρέπει στον πάροχο να προσαρμόζει τη διάρκεια κράτησης ανά περιοχή ή σταθμό, ώστε να βελτιστοποιεί τη διαθεσιμότητα και να αποσυμφορεί τα σημεία υψηλής ζήτησης.
- **Ώρα Έναρξης**: Προγραμματισμένη ώρα έναρξης φόρτισης
- **Μέθοδος Πληρωμής**: Επιλεγμένος τρόπος πληρωμής από το προφίλ χρήστη
- **Καταχωρημένο Όχημα Χρήστη**: Τύπος και μοντέλο οχήματος για στατιστικούς λόγους (προεραιτικό)

##### 3.1.2.5 Expected behaviour

**Main flow**

```
@startuml
start
:User clicks "Reserve" button;
:System checks charger availability;
if (Charger Available?) then (yes)
  :Request payment pre-authorization;
  if (Payment Successful?) then (yes)
    :Lock charger (Status=Reserved);
    :Generate unique Reservation ID;
    :Start reservation timer;
    :Send confirmation notification;
    :Show reservation confirmation;
    stop
  else (no)
    :Show payment error message;
    stop
  endif
else (no)
  :Show "Charger not available" error;
  stop
endif
@enduml
```

**Alternate flow 1: Χειροκίνητη Ακύρωση (User Cancellation)**

Ο χρήστης αποφασίζει να ακυρώσει την κράτηση πριν φτάσει στον φορτιστή.

```
@startuml
start
:User clicks "Cancel Reservation";
:System releases charger
(Status = Available);
:Release payment pre-authorization;
:Send cancellation confirmation;
stop
@enduml
```

**Alternate flow 2: Λήξη Χρόνου / No-Show (Timer Expiry)**

Ο χρήστης δεν εμφανίζεται εντός του καθορισμένου χρονικού ορίου.

```
@startuml
start
:Reservation timer expires;
if (Charging started?) then (No)
  :Cancel Reservation;
  :Change charger status to "Available";
  :Charge no-show fee (optional);
  :Release remaining pre-authorized amount;
  :Send "Reservation expired" notification;
else (Yes)
  :Continue charging flow;
endif
stop
@enduml
```

##### 3.1.2.6 Output data and postconditions
**Output data:**
- Μοναδικό Αναγνωριστικό Κράτησης (Reservation ID)
- Επιβεβαίωση κράτησης με λεπτομέρειες (χρόνος, κόστος προ-δέσμευσης)
- Ειδοποίηση μέσω email/SMS/push notification

**Postconditions:**
- Σε επιτυχή ολοκλήρωση:
  - Ο φορτιστής έχει αλλάξει κατάσταση σε "Κρατημένος"
  - Έχει γίνει προεξόφληση ποσού μέσω Payment Gateway
  - Έχει ενεργοποιηθεί χρονόμετρο κράτησης
  - Ο χρήστης έχει λάβει επιβεβαίωση κράτησης
- Σε αποτυχία:
  - Ο φορτιστής παραμένει διαθέσιμος
  - Δεν έχει γίνει χρέωση

##### 3.1.2.7 Notes
- Η διάρκεια κράτησης είναι περιορισμένη (15-60 λεπτά) για να αποφευχθεί η μακροχρόνια δέσμευση φορτιστών
- Σε περίπτωση no-show, το τέλος ακύρωσης είναι προαιρετικό και καθορίζεται από την πολιτική του παρόχου
- Ο χρήστης μπορεί να έχει μόνο μία ενεργή κράτηση τη φορά


#### 3.1.3 Use Case 3: Display User Statistics

Η περίπτωση χρήσης αυτή περιγράφει τη διαδικασία με την οποία ο εγγεγραμμένος χρήστης (EV Driver) βλέπει στατιστικά στοιχεία και το ιστορικό των φορτίσεών του. Το σύστημα διαχωρίζει την πληροφόρηση σε αναλυτική (για το τελευταίο εξάμηνο) και συγκεντρωτική (για παλαιότερες περιόδους).

##### 3.1.3.1 Roles involved

- **EV Driver (Registered):** Ο εγγεγραμμένος χρήστης που επιθυμεί να ελέγξει την κατανάλωση και το κόστος των φορτίσεών του.
- **Database and Backend System:** Σύστημα αποθήκευσης και ανανέωσης (κατόπιν αιτήματος ή αυτόματα, π.χ. μηνιαία) στατιστικών μέσω της βάσης δεδομένων.
- **Frontend System:** Απεικόνιση στατιστικών στον χρήστη.
- **Notification System (προαιρετικό):** Ενημέρωση χρήστη ότι τα στατιστικά του είναι έτοιμα στην αλλαγή του μήνα.

##### 3.1.3.2 Preconditions

- Ο χρήστης έχει συνδεθεί επιτυχώς στον λογαριασμό του (authentication) και είναι εγγεγραμμένος στο σύστημα.
- Υπάρχουν καταγεγραμμένες συνεδρίες φόρτισης και πληρωμών στη βάση δεδομένων που σχετίζονται με τον λογαριασμό του χρήστη.
- Η συσκευή έχει ενεργή σύνδεση στο διαδίκτυο.

##### 3.1.3.3 Execution environment

- Web-based frontend προσβάσιμο από σύγχρονο browser.

##### 3.1.3.4 Input data

- Επιλογή μεταξύ συγκεντρωτικών ή αναλυτικών στατιστικών.
  - **Συγκεντρωτικά στατιστικά:** Ημερομηνία έναρξης και ημερομηνία λήξης.
  - **Αναλυτικά στατιστικά:** Επιλογή ενός μήνα ή εύρους μηνών μέσα από τους τελευταίους έξι μήνες.

##### 3.1.3.5 Expected behaviour

**Main flow**

```
@startuml

start

:The customer (EV Driver)
selects the option View
Statistics;

:The system retrieves and
displays the default data for
the current month;

' The first decision diamond
if (Statistics Type) then (Aggregated)
    :The customer (EV
    Driver) selects the
    date range;

    :The system retrieves
    aggregated results for
    the specified data
    range;
else (Analytic)
    :The customer selects one
    month or a range of
    months from the last six
    months.;

    :The system retrieves
    analytical information
    based on the specified
    range or month;
endif

:The system updates the
graphs and the table on the
user interface;

:The customer wants to
download the results?;

' The second decision diamond (Download YES/NO)
if () then (YES)
    :The system generates
    dynamically the user statistics
    report;

    :The system sends the file to the
    browser for download;

    :The customer saves the file locally;
    stop
else (NO)
    stop
endif

@enduml
```


##### 3.1.3.6 Output data and postconditions

**Output data**

- Εμφάνιση στατιστικών στην οθόνη (view only), εφόσον δεν επιλεγεί εξαγωγή.
- Λήψη και αποθήκευση αρχείου PDF τοπικά, εφόσον επιλεγεί εξαγωγή.

**Postconditions**

- Σε επιτυχή ολοκλήρωση:
  - Ο χρήστης έχει δει ή/και αποθηκεύσει τα στατιστικά του.
- Σε αποτυχία:
  - Εμφανίζεται κατάλληλο μήνυμα για έλλειψη δεδομένων ή σφάλμα εξαγωγής.

##### 3.1.3.7 Notes 
- Data Aggregation Strategy: Για διαστήματα μεγαλύτερα του εξαμήνου, το σύστημα επιστρέφει προσυμπληρωμένα (pre-calculated) αθροίσματα ανά μήνα, ώστε να ελαχιστοποιείται ο χρόνος απόκρισης της βάσης δεδομένων.
- Σε περίπτωση που δεν υπάρχουν δεδομένα για την επιλεγμένη περίοδο, το PDF που παράγεται και το user interface θα περιέχει σχετική ένδειξη ("No data found").
- Δημιουργία Αναφοράς: Η διαδικασία δημιουργίας του PDF (Report Generation) εκτελείται ασύγχρονα στον server για να μην επιβαρύνει την απόκριση του User Interface, ειδικά όταν ζητείται μεγάλος όγκος δεδομένων
- Σε περίπτωση που ο χρήστης επιθύμει να δει αναλυτικά τα στατιστικά του θα πρέπει να επικοινωνήσει με τα κεντρικά. 

#### 3.1.4 Use case 4: Display Admin Statistics

Ο διαχειριστής δικτύου (CPO) ή κάποιο λογιστικό στέλεχος της εταιρείας που επιθυμεί ανάλυση της επίδοσης του δικτύου,  αποκτά πρόσβαση στον πίνακα ελέγχου (Dashboard) για να παρακολουθήσει την απόδοση του δικτύου φόρτισης. Η λειτουργία επιτρέπει την απεικόνιση κρίσιμων μετρήσεων (όπως έσοδα, κατανάλωση ενέργειας, βλάβες) και την ανάλυση δεδομένων σε διαφορετικά επίπεδα (συνολικά, ανά περιοχή, ανά σταθμό ή ανά φορτιστή), καθώς και την εξαγωγή αναφορών για περαιτέρω επεξεργασία. 


##### 3.1.4.1 Roles involved

- **Administrator** - Ο διαχειριστής που επιθυμεί να ελέγξει την απόδοση και να λάβει επιχειρηματικές αποφάσεις
- **Backend System** - Το σύστημα που συγκεντρώνει, επεξεργάζεται και σερβίρει τα ιστορικά δεδομένα
- **Database** - Η βάση δεδομένων που αποθηκεύει τα αρχεία καταγραφής (logs) των συνεδριών και των βλαβών

##### 3.1.4.2 Preconditions
- Ο χρήστης είναι πιστοποιημένος και συνδεδεμένος στην εφαρμογή διαχείρισης
- Ο χρήστης διαθέτει δικαιώματα "Admin" ή "Manager"
- Υπάρχουν καταγεγραμμένα ιστορικά δεδομένα φόρτισης και συναλλαγών στο σύστημα
- Η συσκευή έχει ενεργή σύνδεση στο διαδίκτυο

##### 3.1.4.3 Execution environment
Web Admin Portal (βελτιστοποιημένο για Desktop ή Smartphone) με δυνατότητες οπτικοποίησης δεδομένων (Data Visualization / Charts)

##### 3.1.4.4 Input data
- **Χρονικό Εύρος (Date Range)**: Η περίοδος αναφοράς (π.χ., Τελευταίες 30 μέρες, Προσαρμοσμένο Εύρος)
- **Κατηγορία Προβολής (View Category)**: Η επιλογή επιπέδου ανάλυσης (System-wide, Per Station, Per Area, Per Charger)
- **Φίλτρα Περιοχής/Σταθμού**: Επιλογή συγκεκριμένων γεωγραφικών περιοχών ή ID σταθμών για εστίαση
- **Μορφή Εξαγωγής (Export Format)**: Επιλογή τύπου αρχείου (CSV για επεξεργασία, PDF για παρουσίαση)

##### 3.1.4.5 Expected Behavior

**Main Flow**

```
@startuml
title Activity Diagram – Admin View Statistics (Optimized)

skinparam conditionStyle insideDiamond

start

:Admin logs in;
:Admin opens "Statistics Dashboard";

' --- INITIAL LOAD ---
:System loads "System-wide" statistics (Default View);
note right
  Defaults: Last 30 days, 
  All Areas, All Stations
end note

:System displays summary metrics and charts;

' --- MAIN INTERACTION LOOP ---
repeat

    ' --- FILTER FLOW ---
    if (Admin needs to filter?) then (Yes)
        :Admin selects Date Range / Station / Area;
        :System reloads data based on new context;
    else (No)
    endif

    ' --- VIEW SWITCHING ---
    :Admin selects/switches View Tab;

    'Using SPLIT to show these are parallel options
    split
        -> **System-wide**;
        :System shows Overall Metrics:
        - Total Sessions & Revenue
        - Total kWh
        - Utilization Heatmap;
    
    split again
        -> **Per Area**;
        :System shows Area Analytics:
        - Revenue per Area
        - Most Popular Areas
        - Regional Peak Hours;
        
    split again
        -> **Per Station**;
        :System shows Station Analytics:
        - Utilization Rate %
        - Queue/Wait times
        - Connector availability;
        
    split again
        -> **Per Charger**;
        :System shows Hardware Analytics:
        - **Fault/Error Logs**
        - Avg. charging speed (kW)
        - Session duration;
    end split

    ' --- EXPORT FLOW ---
    if (Admin clicks Export?) then (Yes)
        :System generates PDF/CSV report
        based on current view;
        :Admin downloads file;
    else (No)
    endif

repeat while (Admin continues analysis?) is (Yes)

stop
@enduml
```

##### 3.1.4.6 Output data and postconditions
**Output data:**
- KPI Cards: Συνοπτικές κάρτες μετρικών (Σύνολο Εσόδων, Σύνολο kWh, Αριθμός Συνεδριών)
- Γραφήματα (Charts):
  - Χάρτης θερμότητας χρήσης (Utilization Heatmap)
  - Καμπύλες εσόδων ανά ημέρα/ώρα
  - Ποσοστά διαθεσιμότητας φορτιστών
  - Λίστες Συμβάντων: Καταγραφή σφαλμάτων (Fault/Error Logs) για την προβολή "Per Charger"
- Αρχείο Αναφοράς: Το αρχείο (PDF/CSV) που κατεβαίνει τοπικά στη συσκευή

**Postconditions:**
- Σε επιτυχή ολοκλήρωση:
  - Τα δεδομένα στην οθόνη έχουν ενημερωθεί σύμφωνα με τα φίλτρα
  - (Σε περίπτωση εξαγωγής) Το αρχείο αναφοράς έχει αποθηκευτεί στη συσκευή του διαχειριστή
- Σε αποτυχία (π.χ., έλλειψη δεδομένων):
  - Εμφανίζεται μήνυμα "No Data Available" για τα επιλεγμένα φίλτρα
  - Το σύστημα παραμένει στην προηγούμενη έγκυρη κατάσταση προβολής

##### 3.1.4.7 Notes
- Κατά την αρχική φόρτωση (Initial Load), το σύστημα εμφανίζει προεπιλεγμένα στατιστικά για τις "Τελευταίες 30 ημέρες" σε επίπεδο "System-wide" για άμεση πληροφόρηση
- Η προβολή "Per Charger" δίνει έμφαση σε τεχνικά δεδομένα (Fault Logs, Hardware status) σε αντίθεση με τις άλλες προβολές που εστιάζουν σε εμπορικά δεδομένα
- Τα δεδομένα είναι Read-Only (μόνο για ανάγνωση); ο διαχειριστής δεν μπορεί να τροποποιήσει τα ιστορικά στοιχεία μέσω αυτής της λειτουργίας





### 3.2 Functional Requirements

**Διάγραμμα Απαιτήσεων Συστήματος:**

```
@startuml

' --- LAYOUT CONFIGURATION ---
left to right direction
skinparam linetype ortho
skinparam nodesep 30
skinparam ranksep 60
skinparam shadowing true
skinparam roundcorner 10
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 12

' --- STYLING ---
skinparam package {
    BackgroundColor #F4F6F7
    BorderColor #B0BEC5
    FontColor #546E7A
    FontStyle bold
}

skinparam class {
    ' Main Body
    BackgroundColor #E9F7EF
    BorderColor #1E8449
    FontColor #145A32
    AttributeFontColor #1E8449
    AttributeFontSize 11
    
    ' Header (Stereotype area)
    HeaderBackgroundColor #ABEBC6
    HeaderFontColor #145A32
    HeaderFontStyle bold
    
    ' Connectors
    ArrowColor #2E4053
    ArrowThickness 1.5
}

hide circle
hide methods

' --- Root Node ---
class "EVCharge Manager System" as Root <<Requirement>> {
    Text: All system requirements
}

' --- 1. Functional Requirements Package ---
package "Functional Requirements" {
    
    class "User Capabilities" as FuncUser <<Requirement>> {
        Id: FUNC-00
        Text: User-facing features
    }

    class "FR-01: Manage Account" as FR1 <<Functional>> {
        Id: FR-01
        Text: User registration & profile
    }

    class "FR-02: Search Chargers" as FR2 <<Functional>> {
        Id: FR-02
        Text: Find on interactive map
    }

    class "FR-03: Reserve Charger" as FR3 <<Functional>> {
        Id: FR-03
        Text: Book for 15-60 mins
    }

    class "FR-04: Charging Session" as FR4 <<Functional>> {
        Id: FR-04
        Text: Start/Stop & Monitor
    }

    class "FR-05: User Statistics" as FR5 <<Functional>> {
        Id: FR-05
        Text: View personal usage stats
    }

    class "FR-07: Transaction History" as FR7 <<Functional>> {
        Id: FR-07
        Text: View & export history
    }

    class "Admin Capabilities" as FuncAdmin <<Requirement>> {
        Id: FUNC-99
        Text: Back-office features
    }

    class "FR-06: Dynamic Pricing" as FR6 <<Functional>> {
        Id: FR-06
        Text: Flexible pricing policies
    }

    class "FR-08: CLI Management" as FR8 <<Functional>> {
        Id: FR-08
        Text: Command line admin tools
    }
}

' --- 2. Non-Functional Requirements Package ---
package "Non-Functional Requirements" {

    class "Performance" as Perf <<Requirement>> {
        Id: NFR-P
        Text: Performance constraints
    }

    class "PERF-01: Response Time" as P1 <<Performance>> {
        Id: PERF-01
        Text: API response < 500ms
    }

    class "PERF-02: Concurrency" as P2 <<Performance>> {
        Id: PERF-02
        Text: Support multiple users
    }

    class "PERF-03: Real-time Updates" as P3 <<Performance>> {
        Id: PERF-03
        Text: Status updates in seconds
    }

    class "Security" as Sec <<Requirement>> {
        Id: NFR-S
        Text: Security constraints
    }

    class "SEC-01: Encryption" as S1 <<Security>> {
        Id: SEC-01
        Text: HTTPS/TLS 1.3 + OAuth
    }

    class "SEC-02: Data Protection" as S2 <<Security>> {
        Id: SEC-02
        Text: PCI-DSS compliance
    }

    class "SEC-03: Authentication" as S3 <<Security>> {
        Id: SEC-03
        Text: Strong auth for payments
    }
    
    class "Availability" as Avail <<Requirement>> {
        Id: NFR-A
        Text: Availability constraints
    }

    class "AVAIL-01: Uptime" as A1 <<Availability>> {
        Id: AVAIL-01
        Text: 99% Service availability
    }

    class "AVAIL-02: Offline Mode" as A2 <<Availability>> {
        Id: AVAIL-02
        Text: Local storage on disconnect
    }

    class "AVAIL-03: Fail-safe" as A3 <<Availability>> {
        Id: AVAIL-03
        Text: Unlock on network failure
    }
}

' --- 3. External Interfaces Package ---
package "External Interfaces" {
    class "OCPP Interface" as HW <<Interface>> {
        Id: INT-01
        Text: Protocol via WebSockets
    }
    
    class "Payment Interface" as Pay <<Interface>> {
        Id: INT-02
        Text: Payment Gateway API
    }

    class "Maps Interface" as Maps <<Interface>> {
        Id: INT-03
        Text: Google Maps API
    }

    class "Identity Interface" as Auth <<Interface>> {
        Id: INT-04
        Text: OAuth Providers
    }

    class "Notification Interface" as Notif <<Interface>> {
        Id: INT-05
        Text: Email/SMS/Push
    }
}

' --- Relationships ---

' Main Branches
Root *-- FuncUser
Root *-- FuncAdmin
Root *-- Perf
Root *-- Sec
Root *-- Avail
Root *-- HW
Root *-- Pay
Root *-- Maps
Root *-- Auth
Root *-- Notif

' Functional Children (User)
FuncUser *-- FR1
FuncUser *-- FR2
FuncUser *-- FR3
FuncUser *-- FR4
FuncUser *-- FR5
FuncUser *-- FR7

' Functional Children (Admin)
FuncAdmin *-- FR6
FuncAdmin *-- FR8

' Performance Children
Perf *-- P1
Perf *-- P2
Perf *-- P3

' Security Children
Sec *-- S1
Sec *-- S2
Sec *-- S3

' Availability Children
Avail *-- A1
Avail *-- A2
Avail *-- A3

' Dependencies between FR and NFR
' Using different color for dependencies to make them distinct
FR3 .[#Red].> S2 : <<requires>>
FR4 .[#Red].> S2 : <<requires>>
FR4 .[#Blue].> P1 : <<satisfies>>
FR2 .[#Blue].> P3 : <<satisfies>>

@enduml
```

**Περιγραφή Λειτουργικών Απαιτήσεων:**

| Κωδικός | Τίτλος | Περιγραφή | Προτεραιότητα |
|---------|--------|-----------|---------------|
| **FR-01** | Διαχείριση Λογαριασμού | Δυνατότητα εγγραφής χρήστη (τοπικά ή με 3rd party OAuth), επεξεργασίας προφίλ, διαχείρισης μέσων πληρωμής και προτιμήσεων. Περιλαμβάνει: εγγραφή, σύνδεση, αποσύνδεση, επαναφορά κωδικού, επεξεργασία προφίλ. | Υψηλή |
| **FR-02** | Αναζήτηση Φορτιστών | Απεικόνιση φορτιστών σε διαδραστικό χάρτη με την επιλογή εφαρμογής φίλτρων (τύπος βύσματος, διαθεσιμότητα, ταχύτητα φόρτισης, απόσταση). Υποστήριξη αναζήτησης χωρίς λογαριασμό (guest mode). | Υψηλή |
| **FR-03** | Δέσμευση Φορτιστή | Δυνατότητα προγραμματισμένης δέσμευσης (reservation) φορτιστή για συγκεκριμένο χρονικό διάστημα (15-60 λεπτά). Περιλαμβάνει προεξόφληση ποσού, ειδοποιήσεις επιβεβαίωσης και δυνατότητα ακύρωσης. | Μέτρια |
| **FR-04** | Διαχείριση Φόρτισης | Λειτουργίες Start/Stop συνεδρίας φόρτισης και παρακολούθηση σε πραγματικό χρόνο (kWh, ποσοστό ολοκλήρωσης, κόστος). Υποστήριξη επικοινωνίας με φορτιστές μέσω OCPP. | Υψηλή |
| **FR-05** | Προβολή Στατιστικών | Απεικόνιση στατιστικών δραστηριότητας χρήστη: δαπάνες/κατανάλωση σε kWh ανά χρονικά διαστήματα, μέσος χρόνος φόρτισης, συχνότερα σημεία φόρτισης, γραφήματα τάσεων. | Χαμηλή |
| **FR-06** | Δυναμική Τιμολόγηση | Υποστήριξη ευέλικτων πολιτικών τιμολόγησης που μπορούν να αλλάζουν βάσει ώρας (peak/off-peak), ζήτησης, τοποθεσίας ή τύπου φορτιστή. Διαχείριση από τον πάροχο. | Μέτρια |
| **FR-07** | Ιστορικό Συναλλαγών | Τήρηση και προβολή πλήρους ιστορικού συνεδριών φόρτισης και οικονομικών συναλλαγών με δυνατότητα φιλτραρίσματος και εξαγωγής δεδομένων (CSV/PDF). | Μέτρια |
| **FR-08** | CLI Διαχείρισης | Παροχή εργαλείων γραμμής εντολών (CLI) για τον Πάροχο: διαχείριση φορτιστών (προσθήκη/επεξεργασία/απενεργοποίηση), εξαγωγή στατιστικών (συνολικά και ανά φορτιστή), διαχείριση χρηστών, ρύθμιση τιμολόγησης. | Μέτρια |

**Εξαρτήσεις μεταξύ Απαιτήσεων:**

- **FR-03** και **FR-04** απαιτούν το **FR-01** (αυθεντικοποίηση χρήστη)
- **FR-05** βασίζεται στο **FR-07** (ιστορικό δεδομένων)
- **FR-04** εφαρμόζει τις πολιτικές του **FR-06** (δυναμική τιμολόγηση)
- **FR-02** είναι προαπαιτούμενο για **FR-03** και **FR-04** (επιλογή φορτιστή)

**Περιορισμοί:**

- Όλες οι λειτουργίες πρέπει να είναι προσβάσιμες μέσω REST API
- Η επικοινωνία με φορτιστές (FR-04) πρέπει να συμμορφώνεται με το πρότυπο OCPP
- Οι οικονομικές συναλλαγές (FR-03, FR-04, FR-07) πρέπει να τηρούν το πρότυπο PCI-DSS

---

### 3.3 Performance Requirements

1. **Χρόνος Απόκρισης:** 
    - Η συνεδρία φόρτισης πρέπει να ξεκινάει σε λίγα δευτερόλεπτα από την στιγμή που ο χρήστης στέλνει την εντολή στην εφαρμογή ώστε να μην υπάρχει χρόνος αναμονής του χρήστη. 
    - Το REST API πρέπει να απαντά στο μεγαλύτερο ποσοστό των αιτημάτων ανάγνωσης δεδομένων σε λιγότερο από **500 ms** υπό κανονικό φορτίο.

2. **Ταυτοχρονισμός:** 
    - Το σύστημα (backend) πρέπει να υποστηρίζει πολλαπλά ταυτόχρονα sessions φόρτισης χωρίς καθυστερήσεις στην επικοινωνία.
    - Το σύστημα πρέπει να υποστηρίζει την ταυτόχρονη πρόσβαση πολλαπλών χρηστών. 

3. **Ενημέρωση Δεδομένων:**
    - Η αλλαγή στην κατάσταση ενός φορτιστή πρέπει να εμφανίζεται σε όλους τους χρήστες σε μερικά δευτερόλεπτα (real time updates) ώστε να μη γίνει εσφαλμένη δέσμευση/έναρξη συνεδρίας.
---

### 3.4 Data Requirements

#### 3.4.1 Data access requirements

- **Βάση Δεδομένων:** Χρήση σχεσιακής βάσης δεδομένων με RDBMS την PostgreSQL.
- **Πρόσβαση μέσω ORM**: Η διαχείριση της βάσης δεδομένων θα γίνεται μέσω επιπέδου αφαίρεσης ORM (Object-Relational Mapping) για την προστασία από επιθέσεις SQL Injection και την ευκολία συντήρησης του κώδικα.
- **API:** Η πρόσβαση στα δεδομένα από το Frontend και το CLI γίνεται αποκλειστικά μέσω REST API, με τα δεδομένα να δίνονται σε μορφές JSON και CSV.
- **Συνοχή Συναλλαγών (ACID):** Πρωτίστως οι οικονομικές συναλλαγές αλλά και οι αλλαγές κατάστασης συνεδρίας θα πρέπει να είναι αδιαίρετες, ώστε να μην υπάρχει διαφθορά στα δεδομένα.
- **Επικοινωνία με Hardware (Websockets)**: Επικοινωνία του server με τους φορτιστές μέσω websockets για παρακολούθηση της κατάστασής τους.
- **Ενημέρωση UI (Server Sent Events):** Eπικοινωνία του server με τους clients μέσω SSE ώστε να γίνεται ενημέρωση για την αλλαγή κατάστασης των φορτιστών.


#### 3.4.2 Semantic data model

Το σύστημα πρέπει να διατηρεί τις εξής κύριες οντότητες:

| Οντότητα | Περιγραφή & Λειτουργικός Ρόλος |
| :--- | :--- |
| **Χρήστης (User)** | Αντιπροσωπεύει το προφίλ του πελάτη που εγγράφεται στην πλατφόρμα. Περιλαμβάνει τα απαραίτητα στοιχεία για την ταυτοποίηση (login), ενώ συνδέεται άμεσα με τις αποθηκευμένες πιστωτικές κάρτες για την εκτέλεση των πληρωμών. |
| **Τοποθεσία (Location)** | Ορίζει τον φυσικό χώρο (π.χ. πάρκινγκ, λιμάνι) όπου φιλοξενούνται οι σταθμοί. Παρέχει τα δεδομένα πλοήγησης (διεύθυνση, συντεταγμένες) και καθορίζει τη γενική προσβασιμότητα του χώρου (π.χ. αν είναι ανοιχτός ή υπό συντήρηση). |
| **Φορτιστής (Charger)** | Περιγράφει τον φυσικό εξοπλισμό φόρτισης. Συνδυάζει την κεντρική μονάδα (Station/EVSE) με τα επιμέρους βύσματα (Connectors), καθορίζοντας την τρέχουσα κατάσταση διαθεσιμότητας (π.χ. Διαθέσιμος, Κατειλημμένος) και την ταχύτητα φόρτισης (kW). |
| **Συνεδρία (Session)** | Αποτελεί το ιστορικό αρχείο κάθε ολοκληρωμένης συναλλαγής. Συνδέει τον χρήστη με τον φορτιστή που χρησιμοποίησε και καταγράφει τα απολογιστικά στοιχεία της φόρτισης (χρόνος έναρξης/λήξης, συνολική ενέργεια και τελικό κόστος). |
| **Κράτηση (Reservation)** | Διατηρεί τα στοιχεία των ενεργών κρατήσεων, οι οποίες αφορούν έναν χρήστη και έναν φορτιστή. Λειτουργεί ως μηχανισμός εγγύησης διαθεσιμότητας, αποτρέποντας τη χρήση του εξοπλισμού από άλλους χρήστες μέχρι να λήξει το χρονικό περιθώριο ή να ξεκινήσει η φόρτιση. 

---

**ER Diagram**

```
@startuml
' VISUAL STYLING
!theme plain
hide circle
skinparam linetype ortho

' ENUMS
enum chargerStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
  FAULTED
  OFFLINE
}

' --- GEOGRAPHY ---
entity "Region" as region {
  name : string <<PK>>
}

entity "County" as county {
  name : string <<PK>>
  --
  region_name : string <<FK>>
}

' --- INFRASTRUCTURE ---

entity "Location" as location {
  ' Represents the parking lot / site
  location_id : serial <<PK>>
  --
  county_name : string <<FK>>
  access: int
  address : string
  available_station_count : int | null {nullable}
  coming_soon: boolean
  charger_types : array
  icon : string
  icon_type : string
  id: int
  in_use_station_count: int | null {nullable}
  latitude : double
  longitude : double
  is_active : boolean
  map_card_logo_url : string
  name : string
  score : float
  station_count : int
  thumbnail_url : string
  under_repair : boolean
  url : string
}

entity "Station" as station {
  ' Represents the physical EVSE box (e.g. The AC post or the DC cabinet)
  station_id : serial <<PK>>
  --
  location_id : int <<FK>>
  network_id : int
  physical_id : string
}

entity "ChargerType" as charger_type {
  ' LOOKUP TABLE: e.g. CCS2, Type 2, CHAdeMO
  type_id : serial <<PK>>
  --
  name : string
  max_supported_power : double
  icon_url : string
}

entity "Charger" as charger {
  ' The specific plug/outlet
  charger_id : serial <<PK>>
  --
  station_id : int <<FK>>
  type_id : int <<FK>>
  status : chargerStatus
  max_power_kw : double
  tariff_per_kwh : float
}

' --- USERS & FINANCE ---

entity "User" as usr {
  usr_id : serial <<PK>>
  --
  email : string
  username : string
  password_hash : string
  first_name : string
  last_name : string
}

entity "PaymentMethod" as pay_method {
  method_name : string <<PK>>
}

entity "SavedCard" as card {
  card_id : serial <<PK>>
  --
  usr_id : int <<FK>>
  method_name : string <<FK>>
  last_4_digits : string
  token : string
}

' --- TRANSACTIONS ---

entity "Reservation" as reservation {
  reservation_id : serial <<PK>>
  --
  usr_id : int <<FK>>
  charger_id : int <<FK>>
  start_time : timestamp
  duration_minutes : int
}

entity "ChargingSession" as session {
  session_id : serial <<PK>>
  --
  usr_id : int <<FK>>
  charger_id : int <<FK>>
  card_id : int <<FK>>
  start_time : timestamp
  end_time : timestamp
  total_kwh : double
  total_cost : float
}

' --- RELATIONSHIPS ---

region ||..o{ county
county ||..o{ location

location ||..o{ station
station ||..o{ charger

charger_type ||..o{ charger

usr ||..o{ card
pay_method ||..o{ card

usr ||..o{ reservation
charger ||..o{ reservation

usr ||..o{ session
charger ||..o{ session
card ||..o{ session
@enduml
```

**Class Diagram**

```
@startuml
' VISUAL STYLING
!theme plain
hide circle
skinparam linetype ortho

' --- ENUMS ---
enum ChargerStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
  FAULTED
  OFFLINE
}

' --- GEOGRAPHY ---
class Region {
  - name : String
  + getCounties() : List<County>
}

class County {
  - name : String
  + getRegion() : Region
  + getLocations() : List<Location>
}

' --- INFRASTRUCTURE ---
class Location {
  - locationId : Integer
  - access : Integer
  - address : String
  - availableStationCount : Integer
  - chargerTypes : List<String>
  - isActive : Boolean
  - name : String
  - score : Float
  
  ' Navigation Methods
  + getStations() : List<Station>
  + getCounty() : County
  ' Logic Methods
  + isOpen() : Boolean
  + hasAvailableChargers() : Boolean
}

class Station {
  - stationId : Integer
  - networkId : Integer
  - physicalId : String
  
  ' Navigation
  + getLocation() : Location
  + getChargers() : List<Charger>
}

class ChargerType {
  - typeId : Integer
  - name : String
  - maxSupportedPower : Double
  
  + getChargers() : List<Charger>
}

class Charger {
  - chargerId : Integer
  - status : ChargerStatus
  - maxPowerKw : Double
  - tariffPerKwh : Float
  
  ' Navigation
  + getStation() : Station
  + getChargerType() : ChargerType
  + getCurrentSession() : ChargingSession
  ' Logic
  + isAvailable() : Boolean
}

' --- USERS & FINANCE ---
class User {
  - usrId : Integer
  - email : String
  - username : String
  - firstName : String
  - lastName : String
  
  ' Navigation
  + getSavedCards() : List<SavedCard>
  + getReservations() : List<Reservation>
  + getChargingHistory() : List<ChargingSession>
  ' Logic
  + login(password : String) : Boolean
  + register() : Boolean
}

class PaymentMethod {
  - methodName : String
  + getSavedCards() : List<SavedCard>
}

class SavedCard {
  - cardId : Integer
  - last4Digits : String
  - token : String
  
  ' Navigation
  + getUser() : User
  + getPaymentMethod() : PaymentMethod
}

' --- TRANSACTIONS ---
class Reservation {
  - reservationId : Integer
  - startTime : DateTime
  - durationMinutes : Integer
  
  ' Navigation (Αντί για FK IDs)
  + getUser() : User
  + getCharger() : Charger
  ' Logic Methods (που δεν υπάρχουν στο ER)
  + getEndTime() : DateTime
  + isExpired() : Boolean
  + cancel() : void
}

class ChargingSession {
  - sessionId : Integer
  - startTime : DateTime
  - endTime : DateTime
  - totalKwh : Double
  - totalCost : Float
  
  ' Navigation
  + getUser() : User
  + getCharger() : Charger
  + getCard() : SavedCard
  ' Logic
  + calculateTotalCost() : Float
  + getDuration() : TimeSpan
  + stopSession() : void
}

' --- RELATIONSHIPS ---

Region "1" -- "*" County : contains
County "1" -- "*" Location : has

Location "1" -- "*" Station : hosts
Station "1" -- "*" Charger : includes
ChargerType "1" -- "*" Charger : describes

User "1" -- "*" SavedCard : owns
PaymentMethod "1" -- "*" SavedCard : type of

' Reservation Relationships
User "1" -- "*" Reservation : makes
Charger "1" -- "*" Reservation : reserved for

' Session Relationships
User "1" -- "*" ChargingSession : initiates
Charger "1" -- "*" ChargingSession : performs
SavedCard "1" -- "*" ChargingSession : pays for

' Enum Usage
Charger ..> ChargerStatus

@enduml
```

### 3.5 Other requirements

#### 3.5.1 Availability

1. **Uptime:** Το σύστημα πρέπει να εγγυάται συγκεκριμένο και υψηλό ποσοστό διαθεσιμότητας (τάξης του 99%) σε βασικές λειτουργίες του συστήματος, καθώς η ανάγκη φόρτισης μπορεί να προκύψει ανά πάσα στιγμή. Λειτουργίες λιγότερο κρίσιμες (όπως η απεικόνιση στατιστικών) δε χρειάζονται τόσο υψηλό ποσοστό διαθεσιμότητας.
2. **Offline Λειτουργία:** Σε περίπτωση απώλειας επικοινωνίας με τον Server, οι φορτιστές πρέπει να μεταβαίνουν αυτόματα σε κατάσταση που αποθηκεύουν τα δεδομένα φόρτισης τοπικά και τα συγχρονίζουν με τον Server μόλις αποκατασταθεί η σύνδεση.
3. **Fail Safe Λήξη Συνεδρίας:** Πρέπει να υπάρχουν μηχανισμοί **fail-safe** ώστε οι φορτιστές να μην "κλειδώνουν" τα καλώδια των χρηστών σε περίπτωση απώλειας δικτύου.
4. **Συντήρηση:** Η συντήρηση που απαιτεί διακοπή της υπηρεσίας (downtime) πρέπει να είναι προγραμματισμένη για ώρες χαμηλής κινητικότητας και να γίνεται γνωστοποίησή της στους χρήστες εγκαίρως.

#### 3.5.2 Security

- Απαιτείται κρυπτογράφηση των ευαίσθητων δεδομένων αυθεντικοποίησης πριν την αποθήκευση. Μονόδρομη κρυπτογράφηση για κωδικούς (σύνδεση μέσω λογαριασμού της εφαρμογής) και αμφίδρομη για OAuth tokens (σύνδεση μέσω 3rd party). 
- Όλες οι επικοινωνίες (μεταξύ App, API, Server) πρέπει να είναι κρυπτογραφημένες (**HTTPS/TLS**).
- Τα ευαίσθητα δεδομένα πληρωμών δεν πρέπει να αποθηκεύονται στη βάση δεδομένων του συστήματος, αλλά να γίνεται χρήση tokens από τον πάροχο πληρωμών.
- Απαιτείται ισχυρή αυθεντικοποίηση (**Authentication**) για κάθε ενέργεια που επιφέρει οικονομική χρέωση.