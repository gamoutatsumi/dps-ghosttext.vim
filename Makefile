TOOLS := ${CURDIR}/.tools

tools: FORCE
	@mkdir -p ${TOOLS}
	@deno install --allow-write --allow-read --allow-net --root ${TOOLS} https://deno.land/x/dlink/dlink.ts

dlink: FORCE
	@cd denops/ghosttext; ${TOOLS}/bin/dlink

FORCE:
