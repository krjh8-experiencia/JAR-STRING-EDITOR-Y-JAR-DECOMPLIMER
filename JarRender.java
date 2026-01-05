import java.io.*;
import java.util.*;
import java.util.jar.*;
import java.util.zip.*;

public class JarReader {

    public static Map<String, String> leerJar(File jarFile) throws Exception {
        Map<String, String> files = new LinkedHashMap<>();

        JarFile jar = new JarFile(jarFile);
        Enumeration<JarEntry> entries = jar.entries();

        while (entries.hasMoreElements()) {
            JarEntry e = entries.nextElement();
            if (e.isDirectory()) continue;

            InputStream is = jar.getInputStream(e);
            byte[] data = is.readAllBytes();

            if (e.getName().endsWith(".class")) {
                files.put(e.getName(), extraerStrings(data));
            } else {
                files.put(e.getName(), new String(data));
            }
        }

        jar.close();
        return files;
    }

    private static String extraerStrings(byte[] bytes) {
        StringBuilder out = new StringBuilder();
        StringBuilder temp = new StringBuilder();

        for (byte b : bytes) {
            if (b >= 32 && b <= 126) {
                temp.append((char) b);
            } else {
                if (temp.length() > 4) {
                    out.append(temp).append("\n");
                }
                temp.setLength(0);
            }
        }
        return out.toString();
    }
}
