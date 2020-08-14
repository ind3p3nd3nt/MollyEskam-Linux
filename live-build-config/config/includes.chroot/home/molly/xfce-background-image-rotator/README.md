# Xface desktop image rotator
Works for Python2.x and Python3.x
## How to use
Create directory and copy images there. If you want to specify your own directory you can do that in `config.py`.
```
$ mkdir ~/Pictures/Wallpapers/
$ cp -r ~/Old/Directory/. ~/Pictures/Wallpapers/
```
Clone repository.
```
$ git clone https://github.com/red-panda-is-here/xface-background-image-rotator.git
$ cd xface-background-image-rotator/
```
Add execute permissions to the file which will be called from crontab.
```
$ chmod +x rotate_desktop_images.sh
```
Open crontab and add new row.
```
$ sudo vim /etc/crontab

30 * * * * username /path/to/project/xface-background-image-rotator/rotate_desktop_images.sh

```
Run `crontab -l` to check if crontab works.

