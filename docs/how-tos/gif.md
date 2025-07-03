```bash
brew install ffmpeg
```

## Gif 1

```sh

# default
ffmpeg -i pmm-market-research-graph-run.mov pmm-market-research-graph-run.gif

# OR below 2 steps (better quality control of scale and fps)
ffmpeg -i pmm-market-research-graph-run.mov -vf "fps=10,scale=500:-1:flags=lanczos,palettegen" -y pmm-market-research-graph-run.palette.png

ffmpeg -i pmm-market-research-graph-run.mov -i pmm-market-research-graph-run.palette.png -filter_complex "fps=10,scale=500:-1:flags=lanczos[x];[x][1:v]paletteuse" -y pmm-market-research-graph-run.gif

# Or below single step (merging 2 steps above)
ffmpeg -i pmm-market-research-graph-run.mov -filter_complex "[0:v] fps=10,scale=500:-1:flags=lanczos,split[v1][v2];[v1]palettegen[p];[v2][p]paletteuse" -y pmm-market-research-graph-run.gif

```

## Gif 2

```sh

# default
ffmpeg -i pmm-prd-graph-run.mov pmm-prd-graph-run.gif

# OR below 2 steps (better quality control of scale and fps)
ffmpeg -i pmm-prd-graph-run.mov -vf "fps=10,scale=500:-1:flags=lanczos,palettegen" -y pmm-prd-graph-run.palette.png

ffmpeg -i pmm-prd-graph-run.mov -i pmm-prd-graph-run.palette.png -filter_complex "fps=10,scale=500:-1:flags=lanczos[x];[x][1:v]paletteuse" -y pmm-prd-graph-run.gif

# Or below single step (merging 2 steps above)
ffmpeg -i pmm-prd-graph-run.mov -filter_complex "[0:v] fps=10,scale=500:-1:flags=lanczos,split[v1][v2];[v1]palettegen[p];[v2][p]paletteuse" -y pmm-prd-graph-run.gif

```

## Gif 3

```sh

# default
ffmpeg -i pmm-market-research-slack-run.mov pmm-market-research-slack-run.gif

# OR below 2 steps (better quality control of scale and fps)
ffmpeg -i pmm-market-research-slack-run.mov -vf "fps=10,scale=500:-1:flags=lanczos,palettegen" -y pmm-market-research-slack-run.palette.png

ffmpeg -i pmm-market-research-slack-run.mov -i pmm-market-research-slack-run.palette.png -filter_complex "fps=10,scale=500:-1:flags=lanczos[x];[x][1:v]paletteuse" -y pmm-market-research-slack-run.gif

# Or below single step (merging 2 steps above)
ffmpeg -i pmm-market-research-slack-run.mov -filter_complex "[0:v] fps=10,scale=500:-1:flags=lanczos,split[v1][v2];[v1]palettegen[p];[v2][p]paletteuse" -y pmm-market-research-slack-run.gif

```
