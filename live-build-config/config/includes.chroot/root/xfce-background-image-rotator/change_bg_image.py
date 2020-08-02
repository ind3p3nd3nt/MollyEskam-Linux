import itertools
import os
import random
from subprocess import check_output, CalledProcessError

from config import IMAGES_DIR

image = random.choice(os.listdir(IMAGES_DIR))
path = os.path.join(IMAGES_DIR, image)


def get_monitors_and_workspaces():
    monitors = set()
    workspaces = set()
    check_monitors_and_workspaces = 'xfconf-query --channel xfce4-desktop --list'
    output = check_output(check_monitors_and_workspaces, shell=True)
    lines = [
        line.strip() for line in str(output).splitlines()
        if 'last-image' in line
    ]

    for line in lines:
        for word in line.split('/'):
            if 'monitor' in word:
                monitors.add(word)
            if 'workspace' in word:
                workspaces.add(word)

    return monitors, workspaces


def change_bg_image():
    monitors, workspaces = get_monitors_and_workspaces()
    for monitor, workspace in itertools.product(monitors, workspaces):
        command = (
            "xfconf-query "
            "--channel xfce4-desktop "
            "--property /backdrop/screen0/{}/{}/last-image -n -t string "
            "--set {}".format(monitor, workspace, path)
        )
        try:
            check_output(command, shell=True)
        except CalledProcessError as e:
            raise e


if __name__ == '__main__':
    change_bg_image()
