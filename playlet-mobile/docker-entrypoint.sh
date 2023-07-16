echo "NativeScript version:"
tns --version

echo ""
echo "TNS doctor output:"
echo "n" | tns doctor

echo ""
echo "Node version:"
node --version

echo ""
echo "NPM version:"
npm --version

echo ""
echo "Java version:"
java -version

echo ""
echo "Android home:"
echo ${ANDROID_HOME}

echo ""
echo "Installed Android SDK packages:"
sdkmanager --list_installed

/bin/bash