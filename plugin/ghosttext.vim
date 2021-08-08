if exists('g:loaded_ghosttext')
  finish
endif
let g:loaded_ghosttext = 1

command! -nargs=* GhostStart call denops#notify("ghosttext", "run", [<f-args>])

if !exists('g:dps_ghosttext#disable_defaultmap')
  let g:dps_ghosttext#disable_defaultmap = 0
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
