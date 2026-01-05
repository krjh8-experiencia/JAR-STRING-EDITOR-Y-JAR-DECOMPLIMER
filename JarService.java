import java.io.*;
import java.util.*;
import java.util.jar.*;

public class JarService {

    public static Map<String, byte[]> readJar(File jarFile) throws Exception {
        Map<String, byte[]> files = new LinkedHashMap<>();
        JarFile jar = new JarFile(jarFile);

        Enumeration<JarEntry> entries = jar.entries();
        while (entries.hasMoreElements()) {
            JarEntry e = entries.nextElement();
            if (!e.isDirectory()) {
                files.put(e.getName(), jar.getInputStream(e).readAllBytes());
            }
        }
        jar.close();
        return files;
    }

    public static File writeJar(Map<String, byte[]> files) throws Exception {
        File out = File.createTempFile("edited", ".jar");
        JarOutputStream jos = new JarOutputStream(new FileOutputStream(out));

        for (String name : files.keySet()) {
            jos.putNextEntry(new JarEntry(name));
            jos.write(files.get(name));
            jos.closeEntry();
        }
        jos.close();
        return out;
    }

    public static String classStrings(byte[] data) {
        StringBuilder sb = new StringBuilder();
        String tmp = "";
        for (byte b : data) {
            if (b >= 32 && b <= 126) tmp += (char)b;
            else {
                if (tmp.length() > 4) sb.append(tmp).append("\n");
                tmp = "";
            }
        }
        return sb.toString();
    }
}
