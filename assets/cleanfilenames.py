# -*- coding: utf-8 -*-


import os
import re

for filename in os.listdir("./"):
    try:
        os.rename("./" + filename, "./newportraits/" + re.search(r'([a-zA-Z])+(-|_)([a-zA-Z])+\.(png|PNG)', filename.replace("_freigestellt", "")).group().replace("PNG", "png").replace("_","-").replace("ü", "ue").replace("ö","oe").replace("ä","ae"))
    except AttributeError:
        pass
