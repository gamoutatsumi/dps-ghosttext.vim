if exists('g:loaded_ghosttext') && g:loaded_ghosttext
  finish
endif
let g:loaded_ghosttext = v:true

function s:start() abort
  while !get(g:, 'dps_ghosttext#init', v:false)
    sleep 1m
  endwhile
  return denops#notify("ghosttext", "run", [])
endfunction

command! GhostStart call s:start()

if !exists('g:dps_ghosttext#disable_defaultmap')
  let g:dps_ghosttext#disable_defaultmap = 0
endif

if !exists('g:dps_ghosttext#enable_autostart')
  let g:dps_ghosttext#enable_autostart = 0
endif

if g:dps_ghosttext#disable_defaultmap
  finish
endif
if exists('g:dps_ghosttext#ftmap')
  if !exists('g:dps_ghosttext#ftmap["github.com"]')
    let g:dps_ghosttext#ftmap['github.com'] = 'markdown'
  endif
else
  let g:dps_ghosttext#ftmap = {
      \ "github.com": "markdown"
      \ }
endif

autocmd User DenopsPluginPost:ghosttext let g:dps_ghosttext#init = v:true

if g:dps_ghosttext#enable_autostart
  autocmd User DenopsPluginPost:ghosttext call denops#notify("ghosttext", "run", [])
endif
