local output = io.open('out.yaml','w')
local input = io.open('tabs.yaml','r')

for line in input:lines() do
  local _,_,name = line:find('^  (%a-):')
  if name then
    output:write('  - '..'\n')
    output:write('    id: '..name..'\n')
  else
    output:write(line..'\n')
  end
end

output:close()
input:close()
