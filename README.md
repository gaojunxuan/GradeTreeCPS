# GradeTreeCPS
A grade tracker app for CPS students.

Check your grade, attendance, schedule and all the things you want to know know about your school life using GradeTree.

## Build and run the project
This project uses Expo and React Native. In order to build and run the project, you have to install Expo-Cli first.
```bash
npm install expo-cli --global
```

Run
```bash
npm install
```
to install all dependencies.

Then run

```bash
expo start
```
in the project directory.

To build standalone packages, run
```bash
expo build:ios
```
For Android, use
```bash
expo build:android
```

## Project Structure
```
│
└─assets
    Asset files including logos and splash screen images
└─components
    UI components. Deprecated.
└─constants
    Colors and global theme files
└─helpers
    Helper classes for http requests
└─navigation
    Codes for tab navigation
└─screen
    AcademicsScreen.js
      Homepage, screen for displaying grades
    AssignmentDetailScreen.js
      Screen for displaying grades for specific category
    AssignmentListScreen.js
      Screen for displaying grades for specific class
    AttendanceScreen.js
      Screen for displaying attendance
    LoginScreen.js
      Login screen
    ProfileScreen.js
      Screen for displaying user profile and information like name, id number, etc.
    ScheduleScreen.js
      Screen for displaying schedule
    TranscriptScreen.js
      Screen for displaying transcript and credit details
App.js
  Declarative portion of the app including startup logic. 
  If there's no username and password stored in the local database, users will be directed to LoginScreen. Otherwise it will navigate to AcademicsScreen
app.json
  Project configurations
package.json
  Dependencies
```

## Code style
The code is kinda messy. I'm going to fix the code style and add more details in this portion later.

## Disclaimer
- This project is created by a student, who has no affiliation with CPS, Aspen, and Follett Corporation.
- This app uses web scraping and has no direct access to CPS database. Also, it doesn't collect any user information without consent.
- This app doesn't enable user to modify their grade and any information stored in CPS database.
- According to the definition in Webster's Dictionary, `hack` refers to `(vi) to gain illegal access to (a computer network, system, etc.)`. This project, however, is not able to directly access any data in CPS server and database and doesn't take advantage of any backend or frontend vulnerabilities. Therefore, this project shouldn't be considered as hacking by any means. 
