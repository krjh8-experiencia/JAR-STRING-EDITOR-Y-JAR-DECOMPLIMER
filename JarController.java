package com.jarviewer;

import org.benf.cfr.reader.api.CfrDriver;
import org.benf.cfr.reader.api.OutputSinkFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;
import java.util.jar.*;

@RestController
@CrossOrigin
public class JarController {

    @PostMapping("/upload")
    public Map<String, Object> upload(@RequestParam MultipartFile file) throws Exception {
        File jarFile = File.createTempFile("upload", ".jar");
        file.transferTo(jarFile);

        JarFile jar = new JarFile(jarFile);
        Map<String, Object> tree = new HashMap<>();

        Enumeration<JarEntry> entries = jar.entries();
        while (entries.hasMoreElements()) {
            JarEntry entry = entries.nextElement();
            buildTree(tree, entry.getName().split("/"), 0);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("tree", tree);
        jar.close();
        return res;
    }

    @PostMapping("/file")
    public String readFile(@RequestParam MultipartFile jar,
                           @RequestParam String path) throws Exception {

        File tmp = File.createTempFile("jar", ".jar");
        jar.transferTo(tmp);

        if (path.endsWith(".class")) {
            return decompile(tmp, path);
        }

        try (JarFile jf = new JarFile(tmp)) {
            InputStream is = jf.getInputStream(jf.getJarEntry(path));
            return new String(is.readAllBytes());
        }
    }

    /* ÁRBOL */
    private void buildTree(Map<String, Object> node, String[] parts, int i) {
        if (i == parts.length) return;
        node.putIfAbsent(parts[i], new HashMap<>());
        buildTree((Map<String, Object>) node.get(parts[i]), parts, i + 1);
    }

    /* DECOMPILADOR REAL */
    private String decompile(File jar, String classPath) {
        StringBuilder out = new StringBuilder();

        CfrDriver driver = new CfrDriver.Builder()
            .withOutputSink(new OutputSinkFactory() {
                public List<SinkClass> getSupportedSinks(SinkType type, Collection<SinkClass> c) {
                    return Collections.singletonList(SinkClass.STRING);
                }

                public <T> Sink<T> getSink(SinkType type, SinkClass sc) {
                    return x -> out.append(x).append("\n");
                }
            }).build();

        driver.analyse(List.of(jar.getAbsolutePath() + "!" + classPath));
        return out.toString();
    }
}
