const LocalStorage = require('node-localstorage').LocalStorage
const localStorage = new LocalStorage('./scratch')

const express = require('express')
const path = require('path')
const app = express()

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.listen(5000, () =>{
    console.log('Server is running on http://localhost:5000')
})

function saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const stored = localStorage.getItem('tasks');
    return stored ? JSON.parse(stored) : [];
}

app.post('/tasks', (req, res) => {
    const tasks = req.body;
    saveTasks(tasks);
    res.json({ message: 'Tasks saved successfully' });
});

app.get('/tasks', (req, res) => {
    const tasks = loadTasks();
    res.json(tasks);
});