import express from 'express'
import fetch from 'node-fetch'

// import { getProjects, createIssues } from './youtrack.js'

const app = express()
const port = 3000

const YOUTRACK_UI_URL = "http://localhost:28282"
const YOUTRACK_API_URL = "http://localhost:28282/api"
const TOKEN = "perm:YWRtaW4=.NDYtMA==.1QcSOcT7UXXx8U0leEsBfC5wB4wbjH"

app.use("/", express.static("./public"))
app.use(express.json());

app.get("/projects", async (req, res) => {
    console.log("prejects requested")
    try {
        res.send(await getProjects())
    } catch(e) {
        res.status(500)
    }
})

app.get("/users", async (req, res) => {
    console.log("users requested")
    try {
        res.send(await getUsers())
    } catch(e) {
        res.status(500)
    }
})

app.post("/issues", async (req, res) => {
    console.log(JSON.stringify(req.body))
    try {
        res.send(await createIssues(req.body.projectId, req.body.summaries, req.body.assigneeLogin))
    } catch(e) {
        res.status(500)
    }
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})


export async function getProjects() {
    return await fetch(`${YOUTRACK_API_URL}/admin/projects?fields=id,shortName`, {
        headers: {
            "Authorization": "Bearer " + TOKEN,
            "Accept": "application/json"
        }
    }).then(res => {
        if (Math.floor(res.status/100) !== 2) {
            console.log(`Error requesting YouTrack: status=${res.status}, body=${JSON.stringify(res.body)}`)
            return Promise.reject(res)
        }
        return Promise.resolve(res.json())
    })
}

export async function getUsers() {
    return await fetch(`${YOUTRACK_API_URL}/users?fields=login,fullName`, {
        headers: {
            "Authorization": "Bearer " + TOKEN,
            "Accept": "application/json"
        }
    }).then(res => {
        if (Math.floor(res.status/100) !== 2) {
            console.log(`Error requesting YouTrack: status=${res.status}, body=${JSON.stringify(res.body)}`)
            return Promise.reject(res)
        }
        return Promise.resolve(res.json())
    })
}


export function createIssues(projectId, summaries, assigneeLogin) {
    var promises = summaries.map(summary => createIssue(projectId, summary, assigneeLogin))
    return Promise.all(promises)
}

export async function createIssue(projectId, summary, assigneeLogin) {
    console.log("Создание задачи с темой " + summary)
    const body = { 
        project: { id: projectId}, 
        summary, 
        description: "Пробуем\n\nещё пробуем", 
        customFields:[ 
            { 
                name:"Priority", 
                $type:"SingleEnumIssueCustomField",
                value: { name:"Critical"}
            }, 
            { 
                name: "Assignee",
                $type: "SingleUserIssueCustomField",
                value: { login: assigneeLogin }
            } 
        ] 
    }
    return await fetch(`${YOUTRACK_API_URL}/issues?fields=id,idReadable`, {
        method: "POST",
        headers: {
            "Content-Type": 'application/json',
            "Authorization": "Bearer " + TOKEN
        },
        body: JSON.stringify(body)
    }).then(res => {
        if (Math.floor(res.status/100) !== 2) {
            console.log(`Error requesting YouTrack: status=${res.status}, body=${JSON.stringify(res.body)}`)
            return Promise.reject(res)
        }
        return res.json()
    }).then(issue => {
        console.log("Создана задача: " + issue)
        return Promise.resolve({
            id: issue.id,
            href: YOUTRACK_UI_URL + "/issue/" + issue.idReadable
        })
    })
}
