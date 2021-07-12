TOOLS := ${CURDIR}/.tools

tools: FORCE
	@mkdir -p ${TOOLS}
	@deno install --allow-write --allow-read --allow-net --root ${TOOLS} https://deno.land/x/dlink/dlink.ts

dlink: FORCE
	@cd denops/ghosttext; ${TOOLS}/bin/dlink
	@make fmt
	@make cache

lint: FORCE
	@deno lint

fmt: FORCE
	@deno fmt

fmt-check: FORCE
	@deno fmt --check

type-check: FORCE
	@deno test --unstable --no-run $$(find . -name '*.ts')

cache: FORCE
	@deno cache --unstable $$(find ./denops/ghosttext/vendor -name '*.ts')

FORCE:
