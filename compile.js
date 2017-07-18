const pug = require('pug')
const fs = require('fs')
const stylus = require('stylus')
const nib = require('nib')
const pd = require('pretty-data').pd
const YAML = require('yamljs')

const IDPrefix = 'CPD'

const args = process.argv.slice(2)

function compilePug(str,local) {
  return pug.compile(str)(local)
}

function loadfile(path) {
  return fs.readFileSync(path,'utf8')
}

//getUID generates unique IDs by a given string. getUIDList gets the list of unique UIDs keyed by their string
let getUID, getUIDList
/*
let uidthing = {}
getUID = function(str) {
  uidthing[str] = str
  return str
}
getUIDList = function() {
  return uidthing
}
//*/
// scoping
//*
if (true) {
  let uid = 0
  let uids = {
    hashtagstats: IDPrefix+'stats'
  }
  let makeUID = function() {
    return IDPrefix + uid++
  }
  getUID = function(str) {
    uids[str] = uids[str] || makeUID()
    return uids[str]
  }
  getUIDList = function() {
    let obj = {}
    for (key in uids) {
      obj[key] = uids[key]
    }
    return obj
  }
}
//*/

//Load in character information
let information = YAML.parse(loadfile(args[1]||'./yaml/out.yaml')) //This line, while runnable, is not being used yet
information.general = YAML.parse(loadfile(args[0]||'./yaml/info.yaml'))

let puglocals = {
  css: '',
  g: getUID,
  maingroup: [],
  filefolder: [],
  information: information,
  addMainGroupMember: function(t,q,l) {
    this.maingroup.push({title: t, quick: q, long: l})
  }
}

function mainGroup() {
  let path = './pug/maingroup'
  fs.readdirSync(path).sort().forEach((file,index) => {
    let stat = fs.statSync(path+'/'+file)
    if (stat.isDirectory()) {
      function q(name) {
        return compilePug(loadfile(path+'/'+file+'/'+name+'.pug'),puglocals)
      }
      puglocals.addMainGroupMember(q('title'),q('quick'),q('long'))
    }
  })
}
mainGroup()
//Name section. No long info







let page = pug.compile(loadfile('pug/statpage.pug'))
//Generate all UIDs used in the pug page to allow them to be inserted into the stylus page
//page({ g: getUID, maingroup: [{title: '', quick: '', long: ''}] })
page(puglocals)

//Prepare Stylus for render
let precss = stylus(loadfile('stylus/statpage.styl'))
  .use(nib())
//Insert all the UIDs generated within the PUG sheet into the Stylus namespace
let uidlist = getUIDList()
for (key in uidlist) {
  precss.define(key,uidlist[key])
}
/*
precss.render((err,out) => {
  if (err) throw err;
  puglocals.css = pd.cssmin(out)
})
//*/
puglocals.css = pd.cssmin(precss.render())

let statpage = page(puglocals)
fs.writeFileSync('./out/statpage.html',statpage)
