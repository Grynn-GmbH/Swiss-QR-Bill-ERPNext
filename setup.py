# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in grynnswissqrbill/__init__.py
from grynnswissqrbill import __version__ as version

setup(
	name='grynnswissqrbill',
	version=version,
	description='Create A Qr Bill According to Swiss QR Market',
	author='Grynn',
	author_email='grynn@grynn.in',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
