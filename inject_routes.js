const fs = require('fs');
let serverFile = fs.readFileSync('server.js', 'utf8');

if (!serverFile.includes('notificationRoutes')) {
    serverFile = serverFile.replace("const reportRoutes = require('./routes/reportRoutes');", "const reportRoutes = require('./routes/reportRoutes');\nconst notificationRoutes = require('./routes/notificationRoutes');");
    serverFile = serverFile.replace("app.use('/api', reportRoutes);", "app.use('/api', reportRoutes);\napp.use('/api', notificationRoutes);");
    fs.writeFileSync('server.js', serverFile, 'utf8');
    console.log("Injected notificationRoutes into server.js");
} else {
    console.log("notificationRoutes already in server.js");
}
