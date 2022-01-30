function ghosttext#start() abort
  return denops#notify("ghosttext", "run", [])
endfunction

function ghosttext#status() abort
  if get(g:, 'dps_ghosttext#init', v:false)
    return denops#request("ghosttext", "status", [])
  else
    return ''
  endif
endfunction
