{
  description = "Claude Code and Vim/Neovim integration plugin powered denops.vim";

  inputs = {
    # keep-sorted start block=yes
    flake-checker = {
      url = "github:DeterminateSystems/flake-checker";
      inputs = {
        nixpkgs = {
          follows = "nixpkgs";
        };
      };
    };
    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs = {
        nixpkgs-lib = {
          follows = "nixpkgs";
        };
      };
    };
    nixpkgs = {
      url = "https://nixos.org/channels/nixos-unstable/nixexprs.tar.xz";
    };
    pre-commit-hooks = {
      url = "github:cachix/git-hooks.nix";
      inputs = {
        nixpkgs = {
          follows = "nixpkgs";
        };
      };
    };
    systems = {
      url = "github:nix-systems/default";
    };
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs = {
        nixpkgs = {
          follows = "nixpkgs";
        };
      };
    };
    # keep-sorted end
  };

  outputs =
    {
      flake-parts,
      systems,
      ...
    }@inputs:
    flake-parts.lib.mkFlake { inherit inputs; } (
      {
        inputs,
        ...
      }:
      {
        systems = import systems;
        imports = [
          inputs.pre-commit-hooks.flakeModule
          inputs.treefmt-nix.flakeModule
        ];

        perSystem =
          {
            system,
            pkgs,
            config,
            inputs',
            ...
          }:
          let
            treefmtBuild = config.treefmt.build;
          in
          {
            _module = {
              args = {
                pkgs = import inputs.nixpkgs {
                  inherit system;
                  config = {
                    allowUnfree = true;
                  };
                };
              };
            };
            checks = config.packages;
            devShells = {
              default = pkgs.mkShell {
                PFPATH = "${
                  pkgs.buildEnv {
                    name = "zsh-comp";
                    paths = config.devShells.default.nativeBuildInputs;
                    pathsToLink = [ "/share/zsh" ];
                  }
                }/share/zsh/site-functions";
                packages = with pkgs; [
                  hello
                ];
                inputsFrom = [
                  config.pre-commit.devShell
                  treefmtBuild.devShell
                ];
              };
            };
            pre-commit = {
              check = {
                enable = true;
              };
              settings = {
                src = ./.;
                hooks = {
                  # keep-sorted start block=yes
                  actionlint = {
                    enable = true;
                  };
                  denolint = {
                    enable = true;
                  };
                  flake-checker = {
                    enable = true;
                    package = inputs'.flake-checker.packages.flake-checker;
                  };
                  treefmt = {
                    enable = true;
                    packageOverrides = {
                      treefmt = treefmtBuild.wrapper;
                    };
                  };
                  # keep-sorted end
                };
              };
            };
            formatter = treefmtBuild.wrapper;
            treefmt = {
              projectRootFile = "flake.nix";
              flakeCheck = false;
              programs = {
                # keep-sorted start block=yes
                deadnix = {
                  enable = true;
                };
                deno = {
                  enable = true;
                };
                keep-sorted = {
                  enable = true;
                };
                mdformat = {
                  enable = true;
                };
                nixfmt = {
                  enable = true;
                };
                statix = {
                  enable = true;
                };
                yamlfmt = {
                  enable = true;
                };
                # keep-sorted end
              };
            };
          };
      }
    );
}
