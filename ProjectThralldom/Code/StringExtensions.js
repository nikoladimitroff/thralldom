
//String.js - liberated from MicrosoftAjax.js on 03/28/10 by Sky Sanders 

/*
Copyright (c) 2009, CodePlex Foundation
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted 
provided that the following conditions are met:

*   Redistributions of source code must retain the above copyright notice, this list of conditions 
    and the following disclaimer.

*   Redistributions in binary form must reproduce the above copyright notice, this list of conditions 
    and the following disclaimer in the documentation and/or other materials provided with the distribution.

*   Neither the name of CodePlex Foundation nor the names of its contributors may be used to endorse or 
    promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY EXPRESS OR IMPLIED 
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR 
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE 
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT 
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, 
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN 
IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.</textarea>
*/

$type = String;
$type.__typeName = 'String';
$type.__class = true;

$prototype = $type.prototype;
$prototype.endsWith = function String$endsWith(suffix) {
    /// <summary>Determines whether the end of this instance matches the specified string.</summary>
    /// <param name="suffix" type="String">A string to compare to.</param>
    /// <returns type="Boolean">true if suffix matches the end of this instance; otherwise, false.</returns>
    return (this.substr(this.length - suffix.length) === suffix);
}

$prototype.startsWith = function String$startsWith(prefix) {
    /// <summary >Determines whether the beginning of this instance matches the specified string.</summary>
    /// <param name="prefix" type="String">The String to compare.</param>
    /// <returns type="Boolean">true if prefix matches the beginning of this string; otherwise, false.</returns>
    return (this.substr(0, prefix.length) === prefix);
}

$prototype.trimEnd = function String$trimEnd() {
    /// <summary >Removes all trailing white spaces from the current String object.</summary>
    /// <returns type="String">The string that remains after all white-space characters are removed from the end of the current String object.</returns>
    return this.replace(/\s+$/, '');
}

$prototype.trimStart = function String$trimStart() {
    /// <summary >Removes all leading white spaces from the current String object.</summary>
    /// <returns type="String">The string that remains after all white-space characters are removed from the start of the current String object.</returns>
    return this.replace(/^\s+/, '');
}