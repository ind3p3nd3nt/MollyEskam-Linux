
# OUR CORE VALUES
## Family | Passion | Integrity | Community | Innovation

### At Offensive Security we have a big mission: to empower the world to fight cyber threats by inspiring the Try Harder mindset. This Try Harder mindset has created a special culture here — one we are determined to protect as we grow.

### Our values help us do that. They are our code of conduct for engaging with each other and the world around us, and help inform our decisions. We hope you appreciate them and the behaviors that support them.
## Family
## Treat each other as family

### We care about one another’s well-being and personal growth
### We respect one another
### We welcome new members who respect our values
### We are authentic in our interactions
### We work as a team and build on each other’s strengths

## Passion
## Be passionate in your contribution

### We take pride in what we do and give the best of ourselves every day
### We believe in our mission, and its value to our customers and communities
### We maintain a spirit of humility and perspective

## Integrity
## Act with integrity

### We behave honestly and ethically
### We respect the gravity of our mission and the importance of our reputation
### We strive for model behavior and hold ourselves to the highest standards
### We strive for transparency whenever we can
### We define goals that encourage team cooperation, not competition

## Community
## Foster and grow with communities

### We appreciate the value of communities, particularly open-source communities
### As good community members, we contribute and cooperate to help everyone succeed

## Innovation
## Innovate to lead the market

### We balance the fine line between technical excellence, good design, and time to market
### We accept mistakes as an opportunity to learn
### We constantly challenge ourselves to create new ideas and adapt to our world

# Join our family!

## If your values match ours, visit our Careers page to see how you can join the OffSec family.

https://www.offensive-security.com/values/

# Kali Linux User Policy

## In order to execute commands at a privileged level, Kali uses two methods todo so:
#### pkexec (GUI & cli)
#### sudo (cli)

### It is also worth bearing in mind, some tools may perform differently without super-user privileges. An example of this is nmap. As stated on the website:

## By default, Nmap performs a SYN Scan, though it substitutes a connect scan if the user does not have proper privileges to send raw packets (requires root access on Unix).

## This means:

### SYN scan (-sS) is the default for a root user. This is quicker as it only sends a SYN packet, but it requires special capabilities in order to perform this, requiring root.
### Connect scan (-sT) is the default for a non-root user. This will complete the 3-way handshake, as a result takes longer and uses more packets than a SYN scan.

## If you wish to restore how Kali previous operated, you can install the following package:

#### kali@kali:~$ sudo apt update
#### kali@kali:~$
#### kali@kali:~$ sudo apt install -y kali-grant-root
#### kali@kali:~$

## This policy is since Kali Linux 2020.1. Here is our previous root policy.

#### Updated on: 2020-Feb-22
#### Author: g0tmi1k

# Kali Linux Network Service Policies

## Kali Linux is a penetration testing toolkit, and may potentially be used in “hostile” environments. Accordingly, Kali Linux deals with network services in a very different way than typical Linux distributions. Specifically, Kali does not enable any externally-listening services by default with the goal of minimizing exposure when in a default state.
Default Disallow Policy

## Kali Linux, as a standard policy, will disallow network services from persisting across reboots by default. The following example can be seen when attempting to install a tool which would by default would start a network proxy service on TCP port 3142:

#### root@kali:~# apt install -y apt-cacher-ng
#### ...SNIP...
#### Setting up apt-cacher-ng (0.7.11-1) ...
#### update-rc.d: We have no instructions for the apt-cacher-ng init script.
#### update-rc.d: It looks like a network service, we disable it.
#### ...SNIP...
#### root@kali:~#

### Notice how the update-rc.d script disallowed persistence of the apt-cacher-ng daemon by default.
### Overriding the Default Policy

## In certain situations, you may actually want certain services to persist over reboots. To allow for this, you can enable a service to persist through reboots using the systemctl command as follows:

#### root@kali:~# systemctl enable apt-cacher-ng
#### Synchronizing state of apt-cacher-ng.service with SysV service script with /lib/systemd/systemd-sysv-install.
#### Executing: /lib/systemd/systemd-sysv-install enable apt-cacher-ng
#### insserv: warning: current start runlevel(s) (empty) of script `apt-cacher-ng' overrides LSB defaults (2 3 4 5).
#### insserv: warning: current stop runlevel(s) (0 1 2 3 4 5 6) of script `apt-cacher-ng' overrides LSB defaults (0 1 6).

### Service whitelists and blacklists

#### Service whitelists and blacklists can be found in the /usr/sbin/update-rc.d file. You can edit this file to explicitly allow or deny services the ability to automatically start up at boot time.

#### root@kali:~# tail -95 /usr/sbin/update-rc.d | more
#### ...SNIP...
#### __DATA__
#### #
#### # List of blacklisted init scripts
#### #
#### apache2 disabled
#### avahi-daemon disabled
#### bluetooth disabled
#### cups disabled
#### dictd disabled
#### ssh disabled
#### ...SNIP...
#### #
#### # List of whitelisted init scripts
#### #
#### acpid enabled
#### acpi-fakekey enabled
#### acpi-support enabled
#### alsa-utils enabled
#### anacron enabled
#### ...SNIP...

##### Updated on: 2020-Jan-10
##### Author: g0tmi1k

# Penetration Testing Tools Policy

## One of the key tasks in transitioning from Backtrack Linux to Kali was combing through the packages and selecting the “best of breed” from what was available.

## We realize that there are many tools or scripts that can do the same job. Some are clearly better than others in some respect, some are more a matter of personal preference. With this in mind, keeping an updated, useful penetration testing tool repository is a challenging task. The Kali Development team uses some of these questions to help decide whether a specific tool should be included in Kali Linux.

#### Is the tool useful/functional in a Penetration Testing environment?
#### Does the tool overlap functionality of other existing tools?
#### Does the licensing of the tool allow for free redistribution?
#### How much resources does the tool require? Will it work in a “standard” environment?

## The answers to questions such as these, among other considerations, help us come to a decision whether the tool should be included in Kali.

## Most of the members of the Kali development team are working penetration testers, and we rely on our combined experience and expertise to select the best tools to add the most value to the Kali distribution as we continue its development.

## Tools which are specifically aimed at DOS, DDOS or anonymity are rarely used in legitimate engagements, and are therefore not installed by default in Kali Linux.
New Tool Requests

## We are always open to adding new and better tools to our distribution, but we ask that a case be made for each tool. Please put some thought and effort into the tool submission, and please do not just send the developers a one line request. Submissions for new tool requests can be made through our Kali Linux bug tracker.

##### Updated on: 2019-Nov-29
##### Author: g0tmi1k

# Kali Linux Open Source Policy

## Kali Linux is a Linux distribution that aggregates thousands of free software packages in its main section. As a Debian derivative, all of the core software in Kali Linux complies with the Debian Free Software Guidelines.

## As the specific exception to the above, Kali Linux’s non-free section contains several tools which are not open source, but which have been made available for redistribution by Offensive Security through default  or specific licensing agreements with the vendors of those tools.

## If you want to build a Kali derivative, you should review the license of each Kali-specific non-free package before including it in your distribution — but note that non-free packages which are imported from Debian are safe to redistribute.

## More importantly, all of the specific developments in Kali Linux’s infrastructure or its integration with the included software have been put under the GNU GPL.

## If you want more information about the license of any given piece of software, you can either check debian/copyright in the source package or /usr/share/doc/package/copyright for a package that you have already installed.

##### Updated on: 2019-Nov-25
##### Author: g0tmi1k

# Kali Linux Trademark Policy

## Kali Linux and Offensive Security want to promote the widespread recognition of our trademarks among the Internet community however, we also need to ensure our trademarks solely identify our company and our products. At the heart of our trademark policy is trust - we want to avoid the public from being confused into believing they are dealing with Kali Linux and/or Offensive Security when, in fact, they are not. This is of particular importance with regards to the development and distribution of trusted penetration testing distribution such as Kali Linux. This document identifies and the describes our trademarks and provides guidance as to their fair use. We are generally quite accommodating when it comes to fair and honest use of our trademarks so if you are so inclined, feel free to contact us for further guidance.

# Kali Linux Update Policies

## The majority of the packages comprising the Kali Linux distribution are drawn directly from the Debian repositories. For those packages which have been incorporated into Kali Linux “as-is” — i.e. the vast majority — security updates arrive at essentially the same time for Kali Linux as for the main Debian distribution.

## Other packages are supported on a best-effort basis by the Kali Linux development team.

##### Updated on: 2019-Nov-25
##### Author: g0tmi1k

# Kali's Relationship With Debian

## The Kali Linux distribution is based on Debian Testing. Therefore, most of the Kali packages are imported, as-is, from the Debian repositories. In some cases, newer packages may be imported from Debian Unstable or Debian Experimental, either to improve user experience, or to incorporate needed bug fixes.
Forked Packages

## In order to implement some of Kali’s unique features, we had to fork some packages. The Kali development team strives to keep such packages to a minimum by improving the upstream packages whenever possible, either by integrating the feature directly, or by adding the required hooks so that it’s straightforward to enable the desired features without further modifying the upstream packages themselves.

## Each package forked by Kali is maintained in a Git repository with a “debian” branch so that updating a forked package can be easily done with a simple git merge debian in its master branch.

# Additional Packages

## Beyond this, Kali incorporates many additional packages which are specific to the penetration testing and security auditing field. The majority of these packages constitute “free software” according to Debian’s Free Software Guidelines. Kali intends to contribute those packages back to Debian and to maintain them directly within Debian.

## To facilitate this, Kali packaging strives to comply with the Debian Policy and follow the best practices in use in Debian.

##### Updated on: 2019-Nov-25
##### Author: g0tmi1k
