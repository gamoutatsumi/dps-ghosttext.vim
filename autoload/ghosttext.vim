function ghosttext#start() abort
  call denops#plugin#wait_async("ghosttext", function("s:start"))
endfunction

function s:start() abort
  call denops#notify("ghosttext", "run", [])
endfunction

function ghosttext#status() abort
  if get(g:, 'dps_ghosttext#init', v:false)
    return denops#request("ghosttext", "status", [])
  else
    return ''
  endif
endfunction
