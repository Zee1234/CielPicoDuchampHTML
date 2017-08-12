const pug = require('pug')
const fs = require('fs')
const stylus = require('stylus')
const nib = require('nib')
const pd = require('pretty-data').pd
const YAML = require('yamljs')

const IDPrefix = 'CPD'

const args = process.argv.slice(2)



function loadfile(path) {
  return fs.readFileSync(path,'utf8')
}

function compilePug(str,local) {
  return pug.compile(str)(local)
}

// scoping
let getPug
if (true) {
  let loadedPug = {}
  getPug = function(path) {
    if (loadedPug[path]) { return loadedPug[path] }

    let loaded
    try {
      loaded = loadfile(path)
    } catch(err) {
      loaded = false
      console.log('Error loading file: '+path)
    }
    if (loaded) {
      loadedPug[path] = loaded
      return loaded
    } else { return '' }
  }
}

//getUID generates unique IDs by a given string. getUIDList gets the list of unique UIDs keyed by their string
let getUID, getUIDList, getNum
// scoping
//*
if (true) { //true to function normally, false to enable classname debugging
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
  getNum = function() { return uid }
} else {
  let uidthing = {}
  getUID = function(str) {
    uidthing[str] = str
    return str
  }
  getUIDList = function() {
    return uidthing
  }
  getNum = () => 0
}

let puglocals = {
  css: '',
  g: getUID,
  maingroup: [],
  filefolder: [],
  filetitle: [],
  information: {
    general: YAML.parse(loadfile(args[0]||'./yaml/info.yaml')),
    histories: YAML.parse(loadfile('./yaml/histories.yaml')),
    faceclaims: YAML.parse(loadfile('./yaml/faceclaims.yaml')),
  },
  addMainGroupMember: function(t,q,l) {
    this.maingroup.push({title: t, quick: q, long: l})
  },
  merge: function(tab) {
    return Object.assign(tab,this)
  }
}

function mainGroup(path) {
  path = path || './pug/maingroup'
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
function fileFolder(path,name,titlename) {
  let tab = getPug(path+'/tab.pug')
  let info = getPug(path+'/info.pug')
  let title = getPug('./pug/filefolder/title.pug')
  puglocals.filetitle.push(compilePug(
    title,
    puglocals.merge({title: titlename})
  ))
  puglocals.filefolder.push(puglocals.information[name].map((x) => {
    return {
      tab: compilePug(tab,puglocals.merge(x)),
      file: compilePug(info,puglocals.merge(x)),
    }
  }))

}
fileFolder('./pug/filefolder/fcs','faceclaims','Descriptions')
fileFolder('./pug/filefolder/histories','histories','Backstories')

//Name section. No long info







let page = pug.compile(getPug('pug/statpage.pug'))
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
fs.writeFileSync('./out/statpage.html',statpage.replace(/\n/g,'<br>'))

console.log(getNum())
