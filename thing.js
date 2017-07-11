let IDPrefix = "superspecialidentifier"



let getUID
// scoping
if (true) {
  let uid = 0,
      uids = {}
      makeUID() = function {
    return IDPrefix + uid++
  }
  getUID = function(str) {
    uids[str] = uids[str] or makeUID()
    return uids[str]
  }
}
