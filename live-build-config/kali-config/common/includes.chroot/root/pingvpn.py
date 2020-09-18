#!/usr/env/bin python3

import subprocess, requests, re, sys
import operator
import argparse, apt, os
import threading
from shutil import copyfile

result_url = []

class fetch_thread(threading.Thread):	
	def __init__(self, count, url,schema):
		threading.Thread.__init__(self)
		self.count = count + 1
		self.url = url
		self.schema = schema

	def run(self):
		response = requests.get(self.schema+self.url, verify=False).status_code
		if response == 200:
			result_url.append(self.url)

def fetch_url(urls,schema):
	threads = []	
	for count, url in enumerate(urls):
		count = fetch_thread(count, url,schema)
		threads.append(count)

	for i in threads:
		i.start()

	for i in threads:
		i.join()

	return result_url

def ask(question,default):
	yes = set(['yes','y','ye'])
	no = set(['no','n'])
	yes.add('') if default == 'y' else no.add('')
	while True:
		choice = input(question + " Default [" + default + "]: ").lower()
		if choice in yes:
			return True
		elif choice in no:
			return False
		else:
			print("\t    Please answer with [y] or [n]: ");

def ping(hostname):
	p = subprocess.Popen(['ping','-c 3', hostname], stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
	p = [str(x.decode('utf-8')) for x in p]

	if not p[0].strip():
		# error
		print("\t[!] Error: Something went wrong ...")
		print("\t    " + p[1].strip())

		response = ask("\t    I got stuck at finding VPN latency. Do you want to retry[y] or skip[n]?",'n')
		if response:
			ping(hostname)
		else:
			return p
	else:
		return p

if __name__ == "__main__":

	# Check if user is root first.
	if os.getuid() != 0:
		sys.exit("[!] Must run as root/sudo\n")
	print("[+] Getting VPN list ...")
	response = requests.get('https://pastebin.com/raw/6bUSXSrY', verify=False).text
	urls = re.findall(r"\^*.*\.sickvpn\.vip+",response)
	print(urls)
	# Banner
	print("#")
	print("# Ping VPN servers and choose the best server based on fastest")
	print("# https://github.com/ind3p3nd3nt/sickvpn.vip")
	print("#\n")
	# Preparing
	https = True
	schema = 'https://' if https else 'http://'
	new_urls = fetch_url(urls,schema)

	VPNs = {}
	print("[+] Finding the best latency")

	for hostname in new_urls:
		hostname = hostname.split("//")[-1]
		while True:
			p = ping(hostname)
			try:
				average = p[0].strip().splitlines()[7].split('=')[1].split('/')[1]
				VPNs[hostname] = str(str(average).zfill(7))
				break
			except Exception as e:
				if not ask("\t[!] Something went wrong. would you like to try again [y] or [n].",'y'):
					print ("\t    Exiting ...\n")
					sys.exit(1)
		print("\t- {0:30} : {1}".format(hostname,average))
	# sorted to fastest VPN
	sorted_VPNs = sorted(VPNs.items(), key=operator.itemgetter(1))
	print("[+] Fastest VPN: " + str(sorted_VPNs[0]))
	print("[+] Preparing ...")
	new_VPN = re.findall(r"\w[a-z]*.*\.sickvpn\.vip",str(sorted_VPNs[0]))
	new_VPN = new_VPN[0]
	filename = "sickvpn.conf"
	with open(filename, 'r+') as f:
	    text = f.read()
	    text = re.sub('mtl.sickvpn.vip', new_VPN, text)
	    f.seek(0)
	    f.write(text)
	    f.truncate()
	print("[+] Done!")