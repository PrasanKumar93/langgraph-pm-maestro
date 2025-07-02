```bash
brew install ffmpeg
```

## Gif 1

```sh

# default
ffmpeg -i market-research-graph-run.mov market-research-graph-run.gif

# OR below 2 steps (better quality control of scale and fps)
ffmpeg -i market-research-graph-run.mov -vf "fps=10,scale=500:-1:flags=lanczos,palettegen" -y market-research-graph-run.palette.png

ffmpeg -i market-research-graph-run.mov -i market-research-graph-run.palette.png -filter_complex "fps=10,scale=500:-1:flags=lanczos[x];[x][1:v]paletteuse" -y market-research-graph-run.gif

# Or below single step (merging 2 steps above)
ffmpeg -i market-research-graph-run.mov -filter_complex "[0:v] fps=10,scale=500:-1:flags=lanczos,split[v1][v2];[v1]palettegen[p];[v2][p]paletteuse" -y market-research-graph-run.gif

```

## Gif 2

```sh

# default
ffmpeg -i prd-graph-run.mov prd-graph-run.gif

# OR below 2 steps (better quality control of scale and fps)
ffmpeg -i prd-graph-run.mov -vf "fps=10,scale=500:-1:flags=lanczos,palettegen" -y prd-graph-run.palette.png

ffmpeg -i prd-graph-run.mov -i prd-graph-run.palette.png -filter_complex "fps=10,scale=500:-1:flags=lanczos[x];[x][1:v]paletteuse" -y prd-graph-run.gif

# Or below single step (merging 2 steps above)
ffmpeg -i prd-graph-run.mov -filter_complex "[0:v] fps=10,scale=500:-1:flags=lanczos,split[v1][v2];[v1]palettegen[p];[v2][p]paletteuse" -y prd-graph-run.gif

```

## Gif 3

```sh

# default
ffmpeg -i market-research-slack.mov market-research-slack.gif

# OR below 2 steps (better quality control of scale and fps)
ffmpeg -i market-research-slack.mov -vf "fps=10,scale=500:-1:flags=lanczos,palettegen" -y market-research-slack.palette.png

ffmpeg -i market-research-slack.mov -i market-research-slack.palette.png -filter_complex "fps=10,scale=500:-1:flags=lanczos[x];[x][1:v]paletteuse" -y market-research-slack.gif

# Or below single step (merging 2 steps above)
ffmpeg -i market-research-slack.mov -filter_complex "[0:v] fps=10,scale=500:-1:flags=lanczos,split[v1][v2];[v1]palettegen[p];[v2][p]paletteuse" -y market-research-slack.gif

```
