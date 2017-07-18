local input = io.open('statpage.html',r)
local output = io.open('statpage.localurls.html',w)
io.output(output)
local content = input:read('*all')
input:close()
local corrected = content:gsub(
  '<a href="(/t%d-%-)" ?t?i?t?l?e?=?"?.-"?>(.-)</a>',
  '[url=naruto-role-play-rpg.forumotion.com%1]%2[/url]'
)
print(corrected)
output:write(corrected)
output:close()
